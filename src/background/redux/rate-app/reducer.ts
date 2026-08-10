import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { RateAppState } from '@background/redux/rate-app/types';

const initialState: RateAppState = {
  ratedInStore: false,
  askForReviewAfter: null
};

const slice = createSlice({
  name: 'rateApp',
  initialState,
  reducers: {
    ratedInStoreChanged: (state, action: PayloadAction<boolean>) => ({
      ...state,
      ratedInStore: action.payload
    }),
    askForReviewAfterChanged: (state, action: PayloadAction<number>) => ({
      ...state,
      askForReviewAfter: action.payload
    }),
    resetRateApp: () => initialState
  }
});

export const { askForReviewAfterChanged, ratedInStoreChanged, resetRateApp } =
  slice.actions;
export const reducer = slice.reducer;
