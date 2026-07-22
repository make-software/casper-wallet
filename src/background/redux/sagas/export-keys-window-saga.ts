import { call, put, select, takeLeading } from 'redux-saga/effects';
import { Windows, windows } from 'webextension-polyfill';

import { RouterPath } from '@popup/router/paths';

import {
  exportKeysWindowIdChanged,
  exportKeysWindowIdCleared
} from '@background/redux/windowManagement/actions';
import { selectExportKeysWindowId } from '@background/redux/windowManagement/selectors';

import { openExportKeysWindow } from './actions';

const EXPORT_KEYS_URL = `popup.html#${RouterPath.DownloadAccountKeys}`;
const SURFACE_WIDTH = 376;
const SURFACE_HEIGHT = 700;

export function* openExportKeysWindowSaga() {
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
        yield call([windows, windows.update], existing.id, {
          focused: true,
          drawAttention: true
        });
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
    // No UI surface here (the menu banner was removed): a failed open is rare
    // (windows.create almost never rejects) and there is no popup left to show
    // it in. The download-failure screen covers the important in-window case.
    console.error(
      'openExportKeysWindowSaga: failed to open export window',
      error
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
