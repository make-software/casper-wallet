import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { CancellableMethod, WindowManagementState } from './types';

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
        origin: string;
        method: CancellableMethod;
      }>
    ) => {
      if (state.requests[action.payload.requestId] != null) {
        return state;
      }

      return {
        ...state,
        requests: {
          ...state.requests,
          [action.payload.requestId]: {
            status: 'open',
            tabId: action.payload.tabId,
            origin: action.payload.origin,
            method: action.payload.method,
            windowIds: []
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
      const request = state.requests[action.payload.requestId];

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
    // It is in-memory only — an MV3 service-worker restart wipes it, after which
    // a late duplicate is no longer deduped. The descriptor is dropped with it,
    // so the map stays proportional to in-flight requests, not to the lifetime
    // total.
    windowRequestResponded: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => ({
      ...state,
      requests: {
        ...state.requests,
        [action.payload.requestId]: { status: 'responded' }
      }
    })
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
  windowRequestOpened,
  windowRequestResponded,
  windowRequestWindowAttached
} = slice.actions;
export const reducer = slice.reducer;
