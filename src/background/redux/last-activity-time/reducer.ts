import { createSlice } from '@reduxjs/toolkit';

import { vaultUnlocked } from '../session/reducer';

export type LastActivityTimeState = number | null;

const initialState = null as LastActivityTimeState;

const slice = createSlice({
  name: 'lastActivityTime',
  initialState,
  reducers: {
    lastActivityTimeRefreshed: {
      prepare: () => ({ payload: { lastActivityTime: Date.now() } }),
      reducer: (_state, action: { payload: { lastActivityTime: number } }) =>
        action.payload.lastActivityTime
    }
  },
  extraReducers: builder => {
    // session's vaultUnlocked also refreshes activity time.
    builder.addCase(
      vaultUnlocked,
      (_state, action) => action.payload.lastActivityTime
    );
  }
});

export const { lastActivityTimeRefreshed } = slice.actions;
export const reducer = slice.reducer;
