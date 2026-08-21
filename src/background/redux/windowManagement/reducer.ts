import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { getRequest, isStorableRequestId } from './request-map';
import { CancellableMethod, WindowManagementState } from './types';

// How many answered requests keep a tombstone. Large enough that a late
// duplicate — which arrives within a request's own lifetime, not hours later —
// is still deduped; small enough to bound the map on the two targets whose
// background page never restarts.
export const MAX_RESPONDED_TOMBSTONES = 50;

// Derived from the map rather than kept in a counter field: a counter is state
// the session record does not carry, so after a service-worker restart it would
// resume at zero and re-issue ordinals the restored map still holds.
const nextSeq = (requests: WindowManagementState['requests']): number => {
  const stamped = Object.values(requests).flatMap(request =>
    request == null ? [] : [request.seq]
  );

  return stamped.length === 0 ? 0 : Math.max(...stamped) + 1;
};

const initialState: WindowManagementState = {
  windowId: null,
  exportKeysWindowId: null,
  requests: {}
};

const slice = createSlice({
  name: 'windowManagement',
  initialState,
  reducers: {
    windowIdChanged: (state, action: PayloadAction<number>) => ({
      ...state,
      windowId: action.payload
    }),
    windowIdCleared: state => ({ ...state, windowId: null }),
    exportKeysWindowIdChanged: (state, action: PayloadAction<number>) => ({
      ...state,
      exportKeysWindowId: action.payload
    }),
    exportKeysWindowIdCleared: state => ({
      ...state,
      exportKeysWindowId: null
    }),
    onboardingAppInit: state => state,
    popupWindowInit: state => state,
    connectWindowInit: state => state,
    importWindowInit: state => state,
    signWindowInit: state => state,
    // The descriptor is written ONCE. `requestId` is page-generated
    // (`generateRequestId`, src/content/sdk.ts) i.e. dapp-controlled, so a
    // repeated id must not overwrite a live request nor resurrect a tombstone.
    windowRequestOpened: (
      state,
      action: PayloadAction<{
        requestId: string;
        tabId: number;
        frameId?: number;
        origin: string;
        method: CancellableMethod;
      }>
    ) => {
      if (
        !isStorableRequestId(action.payload.requestId) ||
        getRequest(state.requests, action.payload.requestId) != null
      ) {
        return state;
      }

      return {
        ...state,
        requests: {
          ...state.requests,
          [action.payload.requestId]: {
            status: 'open',
            tabId: action.payload.tabId,
            frameId: action.payload.frameId,
            origin: action.payload.origin,
            method: action.payload.method,
            windowIds: [],
            awaitingDeviceConfirmation: false,
            seq: nextSeq(state.requests)
          }
        }
      };
    },
    // A Ledger confirmation started or finished for this request. Guarded like
    // its siblings: only a live 'open' descriptor can carry the flag, so a
    // message that arrives after the request was answered cannot resurrect one.
    windowRequestDeviceConfirmationChanged: (
      state,
      action: PayloadAction<{ requestId: string; awaiting: boolean }>
    ) => {
      const request = getRequest(state.requests, action.payload.requestId);

      if (
        request == null ||
        request.status !== 'open' ||
        request.awaitingDeviceConfirmation === action.payload.awaiting
      ) {
        return state;
      }

      return {
        ...state,
        requests: {
          ...state.requests,
          [action.payload.requestId]: {
            ...request,
            awaitingDeviceConfirmation: action.payload.awaiting
          }
        }
      };
    },
    // A window began displaying this request. Dispatched by `openWindow` once
    // `windows.create`/reuse resolves, and by `use-ledger` for the separate
    // permission window.
    windowRequestWindowAttached: (
      state,
      action: PayloadAction<{ requestId: string; windowId: number }>
    ) => {
      const request = getRequest(state.requests, action.payload.requestId);

      if (
        request == null ||
        request.status !== 'open' ||
        request.windowIds.includes(action.payload.windowId)
      ) {
        return state;
      }

      return {
        ...state,
        requests: {
          ...state.requests,
          [action.payload.requestId]: {
            ...request,
            windowIds: [...request.windowIds, action.payload.windowId]
          }
        }
      };
    },
    // A window stopped displaying requests (closed, or reused for a new one).
    windowDetachedFromRequests: (
      state,
      action: PayloadAction<{ windowId: number }>
    ) => {
      const requests: WindowManagementState['requests'] = {
        ...state.requests
      };
      let changed = false;

      for (const [requestId, request] of Object.entries(state.requests)) {
        if (
          request?.status === 'open' &&
          request.windowIds.includes(action.payload.windowId)
        ) {
          requests[requestId] = {
            ...request,
            windowIds: request.windowIds.filter(
              (id: number) => id !== action.payload.windowId
            )
          };
          changed = true;
        }
      }

      return changed ? { ...state, requests } : state;
    },
    // The tombstone is deliberately kept: `selectRequestStatus` reading back
    // 'responded' is what makes the background dedup drop a duplicate response.
    // It is in-memory only, but "in-memory" bounds nothing by itself: on MV3 a
    // service-worker restart wipes it (after which a late duplicate is no
    // longer deduped), while `manifest.v2.json` and `manifest.v2.safari.json`
    // both declare `"persistent": true`, so on Firefox and Safari the
    // background page is never torn down. Nothing here deleted a key, so on
    // those two targets the map grew by one permanent entry per request —
    // keyed by a dapp-supplied string — for the whole browser session. Hence
    // the FIFO cap below: the descriptor is dropped as before, and the oldest
    // tombstones are evicted once there are more than a dedup could plausibly
    // need. Open requests are never evicted.
    windowRequestResponded: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      // A transition, not an upsert — guarded the way its two siblings are.
      // Only a request that is currently 'open' can become 'responded'; the
      // union models ∅ → open → responded and this is what stops the reducer
      // permitting ∅ → responded. Without it, a response the UI forwards for an
      // id the store no longer holds (an MV3 restart between registration and
      // the response) wrote an orphan tombstone that consumed a slot in the cap
      // below and made the SDK entry guard reject that id as a duplicate.
      const request = getRequest(state.requests, action.payload.requestId);

      if (request?.status !== 'open') {
        return state;
      }

      const requests: WindowManagementState['requests'] = {
        ...state.requests,
        [action.payload.requestId]: { status: 'responded', seq: request.seq }
      };

      // Oldest first by stamped ordinal, not by key order: enumeration hoists
      // an integer-like dapp-chosen key ahead of every string key, so `"42"`
      // would be evicted first however recently it was registered.
      const respondedIds = Object.entries(requests)
        .flatMap(([requestId, entry]) =>
          entry?.status === 'responded' ? [[requestId, entry.seq] as const] : []
        )
        .sort(([, a], [, b]) => a - b)
        .map(([requestId]) => requestId);

      const overflow = respondedIds.length - MAX_RESPONDED_TOMBSTONES;
      if (overflow > 0) {
        for (const requestId of respondedIds.slice(0, overflow)) {
          delete requests[requestId];
        }
      }

      return { ...state, requests };
    }
  }
});

export const {
  connectWindowInit,
  exportKeysWindowIdChanged,
  exportKeysWindowIdCleared,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowDetachedFromRequests,
  windowIdChanged,
  windowIdCleared,
  windowRequestDeviceConfirmationChanged,
  windowRequestOpened,
  windowRequestResponded,
  windowRequestWindowAttached
} = slice.actions;
export const reducer = slice.reducer;
