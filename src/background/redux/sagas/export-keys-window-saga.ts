import {
  call,
  delay,
  put,
  race,
  select,
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
const WINDOWS_API_TIMEOUT_MS = 5000;

// Extracted so the whole flow can be raced against a timeout below. Every
// windows.* call here is unbounded, and a HANG is not what the catch handles.
function* runOpenExportKeysWindow() {
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
}

export function* openExportKeysWindowSaga() {
  // Retract what a previous attempt reported before making a new one. Errors
  // are append-only and SagaErrorBanner is mounted route-independently in every
  // UI — including popup.html, which is what EXPORT_KEYS_URL opens. Without
  // this, a retry that succeeds renders the earlier failure's banner on top of
  // the key-download screen, and repeated failures stack identical rows.
  yield put(dismissSagaErrorsBySource(ERROR_SOURCE));

  try {
    // A rejection is what the catch below handles; a HANG is not. takeLeading
    // drops every overlapping trigger while this worker is in flight, so one
    // wedged windows.* call makes the menu item permanently inert until the
    // service worker restarts. The race bounds the worker so the next click
    // gets a fresh attempt.
    const outcome: { timedOut?: true } = yield race({
      completed: call(runOpenExportKeysWindow),
      timedOut: delay(WINDOWS_API_TIMEOUT_MS)
    });

    if (outcome.timedOut) {
      // The window may still appear after this point, untracked — there is no
      // id to remove it by. Bounding the worker is what keeps the menu item
      // usable; it cannot undo a create that is still in flight.
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

export function* exportKeysWindowSaga() {
  // takeLatest would cancel the in-flight generator on a rapid re-dispatch,
  // but windows.create() itself is already fired-and-forgotten by that point —
  // cancellation can't undo it, so a second dispatch would leak an untracked
  // duplicate window. takeLeading runs the first open to completion and drops
  // overlapping triggers, which is the correct semantic for opening a window.
  yield takeLeading(openExportKeysWindow.type, openExportKeysWindowSaga);
}
