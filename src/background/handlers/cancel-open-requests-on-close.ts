import { MainStore } from '@background/redux/get-main-store';
import { windowIdCleared } from '@background/redux/windowManagement/actions';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

import { cancelRequestsDisplacedBy } from './cancel-requests';

// A window closed. Any request it was the last display for is cancelled; a
// request another window (the Ledger permission window) still shows survives.
export async function cancelOpenRequestsForClosedWindow(
  store: MainStore,
  removedWindowId: number
): Promise<void> {
  const clearIfStillTracked = () => {
    if (selectWindowId(store.getState()) === removedWindowId) {
      store.dispatch(windowIdCleared());
    }
  };

  await cancelRequestsDisplacedBy(
    store,
    removedWindowId,
    'cancel-on-close',
    clearIfStillTracked
  );
}
