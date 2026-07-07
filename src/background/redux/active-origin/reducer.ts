import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ActiveOriginState } from './types';

const initialState = null as ActiveOriginState;

const slice = createSlice({
  name: 'activeOrigin',
  initialState,
  reducers: {
    activeOriginChanged: (_state, action: PayloadAction<string | null>) =>
      action.payload
  }
});

export const { activeOriginChanged } = slice.actions;
export const reducer = slice.reducer;
