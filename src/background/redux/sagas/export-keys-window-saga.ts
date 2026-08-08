import { Task } from 'redux-saga';
import {
  call,
  delay,
  join,
  put,
  race,
  select,
  spawn,
  takeLeading
} from 'redux-saga/effects';
import { Windows, windows } from 'webextension-polyfill';

import { RouterPath } from '@popup/router/paths';

import {
  dismissSagaErrorsBySource,
  sagaError
} from '@background/redux/app-events/actions';
import {
  exportKeysWindowIdChanged,
  exportKeysWindowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectExportKeysWindowId } from '@background/redux/windowManagement/selectors';

import { openExportKeysWindow } from './actions';

const EXPORT_KEYS_URL = `popup.html#${RouterPath.DownloadAccountKeys}`;
const SURFACE_WIDTH = 376;
const SURFACE_HEIGHT = 700;
const ERROR_SOURCE = 'openExportKeysWindowSaga';
export const WINDOWS_API_TIMEOUT_MS = 5000;

// Spawned DETACHED by the entry saga, which bounds only how long it WAITS.
// windows.create() cannot be aborted once in flight, so this generator must not
// be cancellable: cancelling it leaves the window on screen with the store never
// learning its id — the exact state WALLET-1391 exists to close, reached from
// slowness alone. Being detached, it also owns its error reporting: a throw here
// would otherwise reach nobody once the entry saga has moved on.
function* runOpenExportKeysWindow() {
  try {
    const windowId: number | null = yield select(selectExportKeysWindowId);

    if (windowId != null) {
      const all: Windows.Window[] = yield call([windows, windows.getAll]);
      // Best-effort guard, not a precise one: type:'popup' narrows the match
      // but doesn't uniquely identify the export window — approval windows
      // (connect/sign/import) are also type:'popup'. A precise tab-URL match
      // isn't used because Firefox omits the extension URL hash from
      // windows.getAll. If the OS reuses this id for another wallet popup,
      // worst case is a misfocus (never key disclosure).
      const existing = all.find(w => w.id === windowId && w.type === 'popup');
      if (existing?.id != null) {
        try {
          yield call([windows, windows.update], existing.id, {
            focused: true,
            drawAttention: true
          });
        } catch (error) {
          // Reported separately from the outer catch: getAll above found the
          // window, so "could not open" would contradict what is on screen.
          // The tracked id is deliberately kept — the window exists, and
          // background/index.ts clears the id on windows.onRemoved. Falling
          // through to windows.create is equally deliberate to avoid: it would
          // open a second export window alongside the one already there.
          console.error(
            'openExportKeysWindowSaga: failed to focus the export window',
            error
          );
          yield put(
            sagaError({
              source: ERROR_SOURCE,
              message: 'Could not focus the export window'
            })
          );
        }

        return;
      }
      yield put(exportKeysWindowIdCleared());
    }

    const currentWindow: Windows.Window = yield call([
      windows,
      windows.getCurrent
    ]);
    // Positioning + TEST_ENV bypass mirror openNewWindow in create-open-window.ts.
    const isTestEnv = Boolean(process.env.TEST_ENV);
    const windowWidth = currentWindow.width ?? 0;
    const xOffset = currentWindow.left ?? 0;
    const yOffset = currentWindow.top ?? 0;

    // Snapshotted rather than null-checked after the fact: the stale-id path
    // above may have just cleared the tracked id, and re-reading it below would
    // otherwise depend on that clear having been applied by the reducer already.
    const trackedBeforeCreate: number | null = yield select(
      selectExportKeysWindowId
    );

    const created: Windows.Window = yield call(
      [windows, windows.create],
      currentWindow.state === 'fullscreen' || isTestEnv
        ? { url: EXPORT_KEYS_URL, type: 'popup', focused: true }
        : {
            url: EXPORT_KEYS_URL,
            type: 'popup',
            focused: true,
            width: SURFACE_WIDTH,
            height: SURFACE_HEIGHT,
            left: windowWidth + xOffset - SURFACE_WIDTH,
            top: yOffset
          }
    );

    if (created.id != null) {
      const trackedNow: number | null = yield select(selectExportKeysWindowId);

      if (trackedNow != null && trackedNow !== trackedBeforeCreate) {
        // We are a straggler: the entry saga stopped waiting on us, told the
        // user to try again, and that retry already produced a tracked window.
        // Overwriting the id here would leave THAT window untracked, and two
        // windows rendering key material is the harm WALLET-1391 is about — so
        // the late one closes instead.
        console.error(
          'openExportKeysWindowSaga: closing an export window that arrived after the timeout'
        );
        yield call([windows, windows.remove], created.id);

        return;
      }

      yield put(exportKeysWindowIdChanged(created.id));
    } else {
      // windows.create RESOLVED, so the window is on screen — but with no id
      // the store cannot track it: selectExportKeysWindowId stays null, the
      // reuse guard above short-circuits, and the next click opens a SECOND
      // window rendering key material. There is also no id to pass to
      // windows.remove, so this is reported, not repaired. `created` is
      // deliberately not logged: a Windows.Window can carry tabs[].url.
      console.error(
        'openExportKeysWindowSaga: the export window resolved without an id'
      );
      yield put(
        sagaError({
          source: ERROR_SOURCE,
          message:
            'Could not track the export window; close it before opening another'
        })
      );
    }
  } catch (error) {
    console.error(
      'openExportKeysWindowSaga: failed to open export window',
      error
    );
    yield put(
      sagaError({
        source: ERROR_SOURCE,
        message: 'Could not open the export window'
      })
    );
  }
}

export function* openExportKeysWindowSaga() {
  // Retract what a previous attempt reported before making a new one. Errors
  // are append-only and SagaErrorBanner is mounted route-independently in every
  // UI — including popup.html, which is what EXPORT_KEYS_URL opens. Without
  // this, a retry that succeeds renders the earlier failure's banner on top of
  // the key-download screen, and repeated failures stack identical rows.
  yield put(dismissSagaErrorsBySource(ERROR_SOURCE));

  // spawn, not fork: a forked child keeps THIS task alive until it settles,
  // which is the very takeLeading wedge being lifted. Detaching lets the wait
  // be abandoned while the work runs on to a tracked id.
  const task: Task = yield spawn(runOpenExportKeysWindow);

  // A rejection is what the worker's own catch handles; a HANG is not.
  // takeLeading drops every overlapping trigger while this task is in flight,
  // so one wedged windows.* call makes the menu item permanently inert until
  // the service worker restarts. Bounding the wait gives the next click a
  // fresh attempt.
  const outcome: { timedOut?: true } = yield race({
    completed: join(task),
    timedOut: delay(WINDOWS_API_TIMEOUT_MS)
  });

  if (outcome.timedOut) {
    console.error(
      'openExportKeysWindowSaga: the export window did not open in time'
    );
    yield put(
      sagaError({
        source: ERROR_SOURCE,
        message: 'The export window did not open in time; try again'
      })
    );
  }
}

export function* exportKeysWindowSaga() {
  // takeLatest would cancel the in-flight generator on a rapid re-dispatch,
  // but windows.create() itself is already fired-and-forgotten by that point —
  // cancellation can't undo it, so a second dispatch would leak an untracked
  // duplicate window. takeLeading runs the first open to completion and drops
  // overlapping triggers, which is the correct semantic for opening a window.
  yield takeLeading(openExportKeysWindow.type, openExportKeysWindowSaga);
}
