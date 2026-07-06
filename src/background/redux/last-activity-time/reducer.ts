import { createSlice } from '@reduxjs/toolkit';

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
    // Interim: session is still typesafe-actions — match by its bare string.
    // Task 9 (session conversion) MUST replace this with addCase(vaultUnlocked, …).
    builder.addCase(
      'VAULT_UNLOCKED',
      (_state, action: any) => action.payload.lastActivityTime
    );
  }
});

export const { lastActivityTimeRefreshed } = slice.actions;
export const reducer = slice.reducer;
