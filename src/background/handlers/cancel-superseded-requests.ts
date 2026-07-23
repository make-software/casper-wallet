import { MainStore } from '@background/redux/get-main-store';
import { selectOpenRequests } from '@background/redux/windowManagement/selectors';

import { cancelRequests } from './cancel-requests';

// Cancel every currently-open approval request because a new one is about to
// take over the single reused approval-window slot. Fire-and-forget: the caller
// (sdk-methods) dispatches windowRequestOpened for the INCOMING request only
// AFTER this returns, so the synchronous snapshot below cannot include it —
// which is why no `exceptRequestId` is needed.
export function cancelSupersededRequests(store: MainStore): void {
  const initiallyOpen = selectOpenRequests(store.getState());
  void cancelRequests(store, initiallyOpen, 'cancel-on-supersede');
}
