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

// One request's descriptor, or undefined when it is unknown or already a
// tombstone. The delivery path needs the whole descriptor — the tab, the frame
// and the origin that actually made the request — and must read it BEFORE the
// tombstone replaces it. Reads through `getRequest`, so a dapp-chosen
// `requestId` cannot resolve to an inherited `Object.prototype` member.
export const selectOpenRequest = (
  state: RootState,
  requestId: string
): OpenRequest | undefined => {
  const request = getRequest(state.windowManagement.requests, requestId);

  return request?.status === 'open' ? { requestId, ...request } : undefined;
};

const selectRequests = (state: RootState) => state.windowManagement.requests;

// Every request still awaiting a response, with its descriptor. Memoized
// (reselect) so the repeated reads on the cancel path — once to pick candidates,
// once after the grace — do not rebuild the array while the slice is unchanged.
//
// Narrowed by the discriminant rather than by a type predicate. TypeScript
// verifies only that an asserted type is assignable to the parameter type, not
// that the predicate body agrees with it — writing `=== 'responded'` in a
// `entry is [string, OpenRequestDescriptor]` filter compiles identically and
// everything downstream stays typed as open descriptors. This is the single
// boundary where descriptors are extracted for the cancel path, so it should
// get the checking the rest of the slice gets for free.
export const selectOpenRequests = createSelector(
  selectRequests,
  (requests): OpenRequest[] =>
    Object.entries(requests).flatMap(([requestId, request]) =>
      request?.status === 'open' ? [{ requestId, ...request }] : []
    )
);
