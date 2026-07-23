import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { CancellableMethod, WindowManagementState } from './types';

const initialState: WindowManagementState = {
  windowId: null,
  exportKeysWindowId: null,
  requests: {},
  pendingRequests: {}
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
    windowRequestOpened: (
      state,
      action: PayloadAction<{
        requestId: string;
        tabId: number;
        origin: string;
        method: CancellableMethod;
      }>
    ) => ({
      ...state,
      requests: {
        ...state.requests,
        [action.payload.requestId]: 'open'
      },
      pendingRequests: {
        ...state.pendingRequests,
        [action.payload.requestId]: {
          tabId: action.payload.tabId,
          origin: action.payload.origin,
          method: action.payload.method
        }
      }
    }),
    // The status entry is kept forever on purpose: `selectRequestStatus` reading
    // back 'responded' is what makes the server-side dedup drop a duplicate
    // response. Deleting it would turn the status into `undefined` and let the
    // duplicate through. The DESCRIPTOR, on the other hand, is only ever read
    // for requests still 'open' (selectOpenRequests filters on that), so it is
    // dead weight once answered — drop it and keep the map proportional to the
    // number of genuinely in-flight requests rather than to the lifetime total.
    windowRequestResponded: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => {
      const pendingRequests = { ...state.pendingRequests };
      delete pendingRequests[action.payload.requestId];

      return {
        ...state,
        requests: {
          ...state.requests,
          [action.payload.requestId]: 'responded'
        },
        pendingRequests
      };
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
  windowIdChanged,
  windowIdCleared,
  windowRequestOpened,
  windowRequestResponded
} = slice.actions;
export const reducer = slice.reducer;
