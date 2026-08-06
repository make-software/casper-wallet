import { call, put, select, takeLeading } from 'redux-saga/effects';
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

export function* openExportKeysWindowSaga() {
  // Retract what a previous attempt reported before making a new one. Errors
  // are append-only and SagaErrorBanner is mounted route-independently in every
  // UI — including popup.html, which is what EXPORT_KEYS_URL opens. Without
  // this, a retry that succeeds renders the earlier failure's banner on top of
  // the key-download screen, and repeated failures stack identical rows.
  yield put(dismissSagaErrorsBySource(ERROR_SOURCE));

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
