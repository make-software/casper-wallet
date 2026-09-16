import { MainStore } from '@background/redux/get-main-store';
import { ledgerStateCleared } from '@background/redux/ledger/actions';
import { selectLedgerNewWindowId } from '@background/redux/ledger/selectors';
import { exportKeysWindowIdCleared } from '@background/redux/windowManagement/actions';
import { selectExportKeysWindowId } from '@background/redux/windowManagement/selectors';

import { cancelOpenRequestsForClosedWindow } from './cancel-open-requests-on-close';

// Never rejects: the listener is fire-and-forget, and an unhandled rejection in
// a service worker is invisible.
export async function handleWindowRemoved(
  store: MainStore,
  removedWindowId: number
): Promise<void> {
  // Before the cancel below, which sleeps CANCEL_GRACE_MS and then awaits a
  // dapp-page tabs.sendMessage: every later Ledger flow is blocked until this lands.
  try {
    if (removedWindowId === selectLedgerNewWindowId(store.getState())) {
      store.dispatch(ledgerStateCleared());
    }
  } catch (error) {
    console.error('window-removed: ledger window cleanup failed', error);
  }

  try {
    await cancelOpenRequestsForClosedWindow(store, removedWindowId);
  } catch (error) {
    console.error('cancel-on-close: failed to cancel open requests', error);
  }

  // Its own try: if the cancel throws, a stale export-keys id makes the next
  // open focus a window that no longer exists.
  try {
    if (removedWindowId === selectExportKeysWindowId(store.getState())) {
      store.dispatch(exportKeysWindowIdCleared());
    }
  } catch (error) {
    console.error('window-removed: export-keys cleanup failed', error);
  }
}
