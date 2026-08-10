import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { ActiveOriginFaviconState } from './types';

const initialState = null as ActiveOriginFaviconState;

const slice = createSlice({
  name: 'activeOriginFavicon',
  initialState,
  reducers: {
    activeOriginFaviconChanged: (
      _state,
      action: PayloadAction<string | null>
    ) => action.payload
  }
});

export const { activeOriginFaviconChanged } = slice.actions;
export const reducer = slice.reducer;
