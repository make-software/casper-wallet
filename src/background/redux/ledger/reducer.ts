import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { LedgerState } from './types';

const initialState: LedgerState = {
  windowId: null,
  openerWindowId: null,
  openerRequestId: null,
  deploy: null,
  transaction: null,
  recipientToSaveOnSuccess: null,
  swapPayload: null
};

/**
 * The permission window signs exactly one parked thing, and resolves it by branch order —
 * `swapPayload` first. Parking either kind therefore clears the other here, so the window
 * cannot pick up a swap the user reviewed minutes ago instead of the transfer they just
 * confirmed. Do not add a park action that leaves the opposite slot standing.
 */
const slice = createSlice({
  name: 'ledger',
  initialState,
  reducers: {
    ledgerNewWindowIdChanged: (
      state,
      {
        payload
      }: PayloadAction<{
        windowId: number;
        openerWindowId: number | null;
        openerRequestId: string | null;
      }>
    ) => ({
      ...state,
      windowId: payload.windowId,
      openerWindowId: payload.openerWindowId,
      openerRequestId: payload.openerRequestId
    }),
    ledgerStateCleared: () => initialState,
    ledgerDeployChanged: (state, { payload }: PayloadAction<string>) => ({
      ...state,
      deploy: payload,
      swapPayload: null
    }),
    ledgerTransactionChanged: (state, { payload }: PayloadAction<string>) => ({
      ...state,
      transaction: payload,
      swapPayload: null
    }),
    ledgerRecipientToSaveOnSuccessChanged: (
      state,
      { payload }: PayloadAction<string>
    ) => ({
      ...state,
      recipientToSaveOnSuccess: payload
    }),
    ledgerSwapPayloadChanged: (
      state,
      { payload }: PayloadAction<string | null>
    ) => ({
      ...state,
      swapPayload: payload,
      deploy: null,
      transaction: null,
      recipientToSaveOnSuccess: null
    })
  }
});

export const {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerSwapPayloadChanged,
  ledgerTransactionChanged
} = slice.actions;
export const reducer = slice.reducer;
