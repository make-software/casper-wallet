import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { isEqualCaseInsensitive } from '@src/utils';

import { AccountInfoState } from './types';

const initialState: AccountInfoState = {
  pendingDeployHashes: [],
  accountTrackingIdOfSentNftTokens: {}
};

const slice = createSlice({
  name: 'accountInfo',
  initialState,
  reducers: {
    accountInfoReset: () => initialState,
    accountPendingDeployHashesChanged: (
      state,
      { payload }: PayloadAction<string>
    ) => ({
      ...state,
      pendingDeployHashes: [payload, ...state.pendingDeployHashes]
    }),
    accountPendingDeployHashesRemove: (
      state,
      { payload }: PayloadAction<string>
    ) => ({
      ...state,
      pendingDeployHashes: state.pendingDeployHashes.filter(
        deploy => !isEqualCaseInsensitive(deploy, payload)
      )
    }),
    accountTrackingIdOfSentNftTokensChanged: (
      state,
      {
        payload: { trackingId, deployHash }
      }: PayloadAction<{ trackingId: string; deployHash: string }>
    ) => ({
      ...state,
      accountTrackingIdOfSentNftTokens: {
        ...state.accountTrackingIdOfSentNftTokens,
        [trackingId]: deployHash
      }
    }),
    accountTrackingIdOfSentNftTokensRemoved: (
      state,
      { payload }: PayloadAction<string>
    ) => {
      const accountTrackingIdOfSentNftTokens = {
        ...state.accountTrackingIdOfSentNftTokens
      };
      delete accountTrackingIdOfSentNftTokens[payload];

      return {
        ...state,
        accountTrackingIdOfSentNftTokens
      };
    }
  }
});

export const {
  accountInfoReset,
  accountPendingDeployHashesChanged,
  accountPendingDeployHashesRemove,
  accountTrackingIdOfSentNftTokensChanged,
  accountTrackingIdOfSentNftTokensRemoved
} = slice.actions;
export const reducer = slice.reducer;
