import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { getRequest, isStorableRequestId } from './request-map';
import { CancellableMethod, WindowManagementState } from './types';

// How many answered requests keep a tombstone: enough that a late duplicate is
// still deduped, small enough to bound the map where nothing else does.
export const MAX_RESPONDED_TOMBSTONES = 50;

// Binding floor on the payload-bearing methods: must stay >= 2 *
// `MAX_STORED_PAYLOADS` (vault/reducer.ts), or an accepted payload is stranded.
export const MAX_OPEN_REQUESTS = 20;

// Derived from the map rather than a counter field: the session record carries
// no counter, so a worker restart would re-issue ordinals the map still holds.
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
    // The descriptor is written ONCE: `requestId` is dapp-controlled, so a
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

      // At the cap, refuse rather than evict: open requests are never evicted,
      // and a refused write must consume no ordinal.
      const openCount = Object.values(state.requests).filter(
        request => request?.status === 'open'
      ).length;

      if (openCount >= MAX_OPEN_REQUESTS) {
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
    // A Ledger confirmation started or finished. Only a live 'open' descriptor
    // can carry the flag, so a message arriving later cannot resurrect one.
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
    // Dispatched by `openWindow` once `windows.create`/reuse resolves, and by
    // `use-ledger` for the separate permission window.
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
    windowRequestResponded: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      // A transition, not an upsert: the union models ∅ → open → responded, so
      // a response for an id the store no longer holds writes no orphan.
      const request = getRequest(state.requests, action.payload.requestId);

      if (request?.status !== 'open') {
        return state;
      }

      // Restamped rather than keeping the registration `seq`: eviction below is
      // oldest-ANSWERED-first, so the reused ordinal could evict itself.
      const requests: WindowManagementState['requests'] = {
        ...state.requests,
        [action.payload.requestId]: {
          status: 'responded',
          seq: nextSeq(state.requests)
        }
      };

      // By stamped ordinal, not key order: enumeration hoists an integer-like
      // dapp-chosen key, so `"42"` would go first however recently answered.
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
    },
    // Dispatched only from `resetVaultSaga`, never forwarded from the UI; the
    // reset flow clears the session mirror directly (session-store.ts).
    windowManagementReseted: () => initialState
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
  windowManagementReseted,
  windowRequestDeviceConfirmationChanged,
  windowRequestOpened,
  windowRequestResponded,
  windowRequestWindowAttached
} = slice.actions;
export const reducer = slice.reducer;
