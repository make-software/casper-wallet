import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { AppEventsState } from './types';

const initialState: AppEventsState = {
  dismissedEventIds: []
};

const slice = createSlice({
  name: 'appEvents',
  initialState,
  reducers: {
    dismissAppEvent: (state, action: PayloadAction<number>) => ({
      ...state,
      dismissedEventIds: [
        ...new Set([...state.dismissedEventIds, action.payload])
      ]
    }),
    resetAppEventsDismission: () => initialState
  }
});

export const { dismissAppEvent, resetAppEventsDismission } = slice.actions;
export const reducer = slice.reducer;
