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

// Is a Ledger confirmation in flight in this window? Composed from the request
// side rather than stored per window — see `awaitingDeviceConfirmation` in
// ./types for why. Read by `openWindow` before it reuses the shared slot.
export const selectIsWindowBusyWithDevice = (
  state: RootState,
  windowId: number
): boolean =>
  selectOpenRequests(state).some(
    request =>
      request.awaitingDeviceConfirmation && request.windowIds.includes(windowId)
  );
