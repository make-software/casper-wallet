import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { LedgerState } from './types';

const initialState: LedgerState = {
  windowId: null,
  deploy: null,
  transaction: null,
  recipientToSaveOnSuccess: null
};

const slice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    ledgerNewWindowIdChanged: (state, { payload }: PayloadAction<number>) => ({
      ...state,
      windowId: payload
    }),
    ledgerStateCleared: () => initialState,
    ledgerDeployChanged: (state, { payload }: PayloadAction<string>) => ({
      ...state,
      deploy: payload
    }),
    ledgerTransactionChanged: (state, { payload }: PayloadAction<string>) => ({
      ...state,
      transaction: payload
    }),
    ledgerRecipientToSaveOnSuccessChanged: (
      state,
      { payload }: PayloadAction<string>
    ) => ({
      ...state,
      recipientToSaveOnSuccess: payload
    })
  }
});

export const {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerTransactionChanged
} = slice.actions;
export const reducer = slice.reducer;
