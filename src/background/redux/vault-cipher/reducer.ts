import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { VaultCipherState } from './types';

const initialState = null as VaultCipherState;

const slice = createSlice({
  name: 'vaultCipher',
  initialState,
  reducers: {
    vaultCipherReseted: () => initialState,
    vaultCipherCreated: (
      _state,
      action: PayloadAction<{ vaultCipher: string }>
    ) => action.payload.vaultCipher
  }
});

export const { vaultCipherCreated, vaultCipherReseted } = slice.actions;
export const reducer = slice.reducer;
