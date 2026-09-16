import { createSelector } from 'reselect';

import { RootState } from '@background/redux/store-types';

import { getRequest } from './request-map';
import { OpenRequest, RequestStatus } from './types';

export const selectWindowId = (state: RootState): number | null =>
  state.windowManagement.windowId;

export const selectExportKeysWindowId = (state: RootState): number | null =>
  state.windowManagement.exportKeysWindowId;

export const selectRequestStatus = (
  state: RootState,
  requestId: string
): RequestStatus | undefined =>
  getRequest(state.windowManagement.requests, requestId)?.status;

// One request's descriptor, or undefined when unknown or already a tombstone.
// Reads through `getRequest`: a dapp-chosen id must not hit `Object.prototype`.
export const selectOpenRequest = (
  state: RootState,
  requestId: string
): OpenRequest | undefined => {
  const request = getRequest(state.windowManagement.requests, requestId);

  return request?.status === 'open' ? { requestId, ...request } : undefined;
};

const selectRequests = (state: RootState) => state.windowManagement.requests;

// Memoized so the cancel path's repeated reads do not rebuild the array.
// Narrowed by the discriminant: a type predicate's body is not type-checked.
export const selectOpenRequests = createSelector(
  selectRequests,
  (requests): OpenRequest[] =>
    Object.entries(requests).flatMap(([requestId, request]) =>
      request?.status === 'open' ? [{ requestId, ...request }] : []
    )
);

// Is a Ledger confirmation in flight in this window? Read by `openWindow`
// before it reuses the shared slot.
export const selectIsWindowBusyWithDevice = (
  state: RootState,
  windowId: number
): boolean =>
  selectOpenRequests(state).some(
    request =>
      request.awaitingDeviceConfirmation && request.windowIds.includes(windowId)
  );
