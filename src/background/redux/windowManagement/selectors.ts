import { RootState } from '@background/redux/store-types';

import { RequestStatus } from './types';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;

export const selectRequestStatus = (
  state: RootState,
  requestId: string
): RequestStatus | undefined => state.windowManagement.requests[requestId];

export const selectOpenRequests = (state: RootState) =>
  Object.entries(state.windowManagement.requests)
    .filter(([, status]) => status === 'open')
    .map(([requestId]) => ({
      requestId,
      ...state.windowManagement.pendingRequests[requestId]
    }));
