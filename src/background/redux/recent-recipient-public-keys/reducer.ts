import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { RecentRecipientPublicKeysState } from './types';

const initialState = [] as RecentRecipientPublicKeysState;

const slice = createSlice({
  name: 'recentRecipientPublicKeys',
  initialState,
  reducers: {
    recipientPublicKeyReseted: () => initialState,
    recipientPublicKeyAdded: (state, action: PayloadAction<string>) => [
      ...new Set([action.payload, ...state])
    ]
  }
});

export const { recipientPublicKeyAdded, recipientPublicKeyReseted } =
  slice.actions;
export const reducer = slice.reducer;
