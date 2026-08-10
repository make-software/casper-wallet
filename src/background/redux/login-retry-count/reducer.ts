import { createSlice } from '@reduxjs/toolkit';

export type LoginRetryCountState = number;

const initialState = 0 as LoginRetryCountState;

const slice = createSlice({
  name: 'loginRetryCount',
  initialState,
  reducers: {
    loginRetryCountReseted: () => initialState,
    loginRetryCountIncremented: state => state + 1
  }
});

export const { loginRetryCountIncremented, loginRetryCountReseted } =
  slice.actions;
export const reducer = slice.reducer;
