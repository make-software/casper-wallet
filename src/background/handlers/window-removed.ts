import { MainStore } from '@background/redux/get-main-store';
import { exportKeysWindowIdCleared } from '@background/redux/windowManagement/actions';
import { selectExportKeysWindowId } from '@background/redux/windowManagement/selectors';

import { cancelOpenRequestsForClosedWindow } from './cancel-open-requests-on-close';

// Everything `windows.onRemoved` does, as one testable unit. It used to live
// inline in the background entry point, which no test imports — so the listener
// shape, its error handling and the removal of the old tracked-id guard were
// all unverified, and reverting them left the suite green.
//
// Never rejects: the listener is fire-and-forget, and an unhandled rejection in
// a service worker is invisible.
export async function handleWindowRemoved(
  store: MainStore,
  removedWindowId: number
): Promise<void> {
  try {
    await cancelOpenRequestsForClosedWindow(store, removedWindowId);
  } catch (error) {
    console.error('cancel-on-close: failed to cancel open requests', error);
  }

  // Independent of the above, and deliberately in its own try: if the cancel
  // throws, leaving the tracked export-keys id set means the next export-keys
  // open focuses a window that no longer exists.
  try {
    if (removedWindowId === selectExportKeysWindowId(store.getState())) {
      store.dispatch(exportKeysWindowIdCleared());
    }
  } catch (error) {
    console.error('window-removed: export-keys cleanup failed', error);
  }
}
