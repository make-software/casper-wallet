import { MainStore } from '@background/redux/get-main-store';
import { windowIdCleared } from '@background/redux/windowManagement/actions';
import {
  selectOpenRequests,
  selectWindowId
} from '@background/redux/windowManagement/selectors';

import { cancelRequests } from './cancel-requests';

// Re-exported for cancel-open-requests-on-close.test.ts, which asserts this.
export { CANCEL_GRACE_MS } from './cancel-requests';

export async function cancelOpenRequestsForClosedWindow(
  store: MainStore,
  removedWindowId: number
): Promise<void> {
  const initiallyOpen = selectOpenRequests(store.getState());

  // Null windowId only if the removed window is still the tracked one (no new
  // window took over during the grace). windowIdCleared touches ONLY windowId,
  // never the requests map, so it cannot clobber a concurrently-registered
  // request.
  const clearIfStillTracked = () => {
    if (selectWindowId(store.getState()) === removedWindowId) {
      store.dispatch(windowIdCleared());
    }
  };

  await cancelRequests(
    store,
    initiallyOpen,
    'cancel-on-close',
    clearIfStillTracked
  );
}
