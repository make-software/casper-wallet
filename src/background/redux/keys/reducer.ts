import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { KeysState } from './types';

const initialState: KeysState = {
  passwordHash: null,
  passwordSaltHash: null,
  keyDerivationSaltHash: null,
  keysDoesExist: false
};

export const withDerivedFlag = (state: KeysState): KeysState => ({
  ...state,
  keysDoesExist:
    state.passwordHash != null &&
    state.passwordSaltHash != null &&
    state.keyDerivationSaltHash != null
});

const slice = createSlice({
  name: 'keys',
  initialState,
  reducers: {
    keysUpdated: (
      state,
      // keysDoesExist is derived — callers can never set it, even type-level
      action: PayloadAction<Partial<Omit<KeysState, 'keysDoesExist'>>>
    ) => withDerivedFlag({ ...state, ...action.payload }),
    keysReseted: () => initialState
  }
});

export const { keysReseted, keysUpdated } = slice.actions;
export const reducer = slice.reducer;
