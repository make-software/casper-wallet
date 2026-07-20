import { createSelector } from 'reselect';

import { RootState } from '@background/redux/store-types';

import { RequestStatus } from './types';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;

export const selectRequestStatus = (
  state: RootState,
  requestId: string
): RequestStatus | undefined => state.windowManagement.requests[requestId];

const selectRequests = (state: RootState) => state.windowManagement.requests;

const selectPendingRequests = (state: RootState) =>
  state.windowManagement.pendingRequests;

// Joins the status map with the descriptor map, yielding the descriptor of
// every request still awaiting a response. Memoized (reselect) so repeated
// reads — `cancelOpenRequestsForClosedWindow` reads it once before the grace
// and once after — do not rebuild the array while the slice is unchanged.
export const selectOpenRequests = createSelector(
  selectRequests,
  selectPendingRequests,
  (requests, pendingRequests) =>
    Object.entries(requests)
      .filter(([, status]) => status === 'open')
      .map(([requestId]) => ({ requestId, ...pendingRequests[requestId] }))
);
