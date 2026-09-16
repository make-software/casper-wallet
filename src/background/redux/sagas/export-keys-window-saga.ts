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

// Spawned detached: windows.create() cannot be aborted, so cancelling would leave
// the window on screen with the store never learning its id.
function* runOpenExportKeysWindow() {
  try {
    const windowId: number | null = yield select(selectExportKeysWindowId);

    if (windowId != null) {
      const all: Windows.Window[] = yield call([windows, windows.getAll]);
      // Best-effort: type:'popup' narrows but doesn't uniquely identify the export
      // window, and Firefox omits the URL hash from getAll, so no tab-URL match.
      const existing = all.find(w => w.id === windowId && w.type === 'popup');
      if (existing?.id != null) {
        try {
          yield call([windows, windows.update], existing.id, {
            focused: true,
            drawAttention: true
          });
        } catch (error) {
          // Reported separately from the outer catch: the window is on screen, so
          // "could not open" would contradict it. onRemoved clears the tracked id.
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

    // Taken before the first unbounded windows.* call: read downstream of a hang it
    // would already hold the retry's id, leaving the comparison below always false.
    const trackedBeforeCreate: number | null = yield select(
      selectExportKeysWindowId
    );

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
      const trackedNow: number | null = yield select(selectExportKeysWindowId);

      if (trackedNow != null && trackedNow !== trackedBeforeCreate) {
        // A straggler: the retry the timeout invited already tracked a window.
        // Overwriting the id would strand it, so the late window closes instead.
        console.error(
          'openExportKeysWindowSaga: closing an export window that arrived after the timeout'
        );
        yield call([windows, windows.remove], created.id);

        return;
      }

      yield put(exportKeysWindowIdChanged(created.id));
    } else {
      // On screen but untrackable: the next click opens a second window rendering
      // key material. `created` is not logged — a Windows.Window can carry urls.
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
  // Errors are append-only and the banner is mounted in every UI, so without this
  // a successful retry still renders the earlier failure over the key screen.
  yield put(dismissSagaErrorsBySource(ERROR_SOURCE));

  // spawn, not fork: a forked child would keep this task alive until it settles,
  // which is the very takeLeading wedge being lifted.
  const task: Task = yield spawn(runOpenExportKeysWindow);

  // A rejection is what the worker's own catch handles; a hang is not. takeLeading
  // drops overlapping triggers, so one wedged call makes the menu item inert.
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
  // takeLatest would cancel the in-flight generator, but cancellation cannot undo
  // windows.create() — a second dispatch would leak an untracked duplicate window.
  yield takeLeading(openExportKeysWindow.type, openExportKeysWindowSaga);
}
