import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { RequestStatus, WindowManagementState } from './types';

const initialState: WindowManagementState = { windowId: null, requests: {} };

const slice = createSlice({
  name: 'windowManagement',
  initialState,
  reducers: {
    windowIdChanged: (state, action: PayloadAction<number>) => ({
      ...state,
      windowId: action.payload
    }),
    windowIdCleared: state => ({ ...state, windowId: null }),
    onboardingAppInit: state => state,
    popupWindowInit: state => state,
    connectWindowInit: state => state,
    importWindowInit: state => state,
    signWindowInit: state => state,
    windowRequestOpened: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => ({
      ...state,
      requests: {
        ...state.requests,
        [action.payload.requestId]: 'open'
      }
    }),
    windowRequestResponded: (
      state,
      action: PayloadAction<{ requestId: string }>
    ) => ({
      ...state,
      requests: {
        ...state.requests,
        [action.payload.requestId]: 'responded'
      }
    }),
    windowClosed: state => ({
      ...state,
      windowId: null,
      requests: Object.entries(state.requests).reduce<
        Record<string, RequestStatus>
      >((acc, [requestId, status]) => {
        acc[requestId] = status === 'open' ? 'closed' : status;
        return acc;
      }, {})
    })
  }
});

export const {
  connectWindowInit,
  importWindowInit,
  onboardingAppInit,
  popupWindowInit,
  signWindowInit,
  windowClosed,
  windowIdChanged,
  windowIdCleared,
  windowRequestOpened,
  windowRequestResponded
} = slice.actions;
export const reducer = slice.reducer;
