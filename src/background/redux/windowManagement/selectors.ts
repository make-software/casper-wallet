import { RootState } from '@background/redux/store-types';

import { RequestStatus } from './types';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;

export const selectRequestStatus = (
  state: RootState,
  requestId: string
): RequestStatus | undefined => state.windowManagement.requests[requestId];
