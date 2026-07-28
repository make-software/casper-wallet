import { createSelector } from 'reselect';

import { RootState } from '@background/redux/store-types';

import { OpenRequest, OpenRequestDescriptor, RequestStatus } from './types';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;

export const selectExportKeysWindowId = (state: RootState): number | null =>
  state.windowManagement.exportKeysWindowId;

export const selectRequestStatus = (
  state: RootState,
  requestId: string
): RequestStatus | undefined =>
  state.windowManagement.requests[requestId]?.status;

const selectRequests = (state: RootState) => state.windowManagement.requests;

// Every request still awaiting a response, with its descriptor. Memoized
// (reselect) so the repeated reads on the cancel path — once to pick candidates,
// once after the grace — do not rebuild the array while the slice is unchanged.
export const selectOpenRequests = createSelector(selectRequests, requests =>
  Object.entries(requests)
    .filter(
      (entry): entry is [string, OpenRequestDescriptor] =>
        entry[1].status === 'open'
    )
    .map(([requestId, request]): OpenRequest => ({ requestId, ...request }))
);
