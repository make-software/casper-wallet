import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { LoginRetryLockoutTimeState } from './types';

const initialState = null as LoginRetryLockoutTimeState;

const slice = createSlice({
  name: 'loginRetryLockoutTime',
  initialState,
  reducers: {
    loginRetryLockoutTimeReseted: () => initialState,
    loginRetryLockoutTimeSet: (_state, action: PayloadAction<number>) =>
      action.payload
  }
});

export const { loginRetryLockoutTimeReseted, loginRetryLockoutTimeSet } =
  slice.actions;
export const reducer = slice.reducer;
