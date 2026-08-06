import { MainStore } from '@background/redux/get-main-store';
import { windowIdCleared } from '@background/redux/windowManagement/actions';
import { selectWindowId } from '@background/redux/windowManagement/selectors';

import { cancelRequestsDisplacedBy } from './cancel-requests';

// A window closed. Any request it was the last display for is cancelled; a
// request another window (the Ledger permission window) still shows survives.
// Called for EVERY removed window, so an untracked one simply finds no
// candidates and clears nothing.
export async function cancelOpenRequestsForClosedWindow(
  store: MainStore,
  removedWindowId: number
): Promise<void> {
  // Null windowId only if the removed window is still the tracked one (no new
  // window took over during the grace). windowIdCleared touches ONLY windowId,
  // never the requests map.
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
