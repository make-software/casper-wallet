import { createSlice } from '@reduxjs/toolkit';

import { SessionState } from './types';

const initialState: SessionState = {
  encryptionKeyHash: null,
  encryptionKeyDoesExist: false,
  isLocked: true,
  isContactEditingAllowed: false
};

const slice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    sessionReseted: () => initialState,
    vaultUnlocked: {
      prepare: () => ({ payload: { lastActivityTime: Date.now() } }),
      reducer: (state: SessionState) => ({ ...state, isLocked: false })
    },
    encryptionKeyHashCreated: (
      state,
      action: { payload: { encryptionKeyHash: string } }
    ) => ({
      ...state,
      encryptionKeyHash: action.payload.encryptionKeyHash,
      encryptionKeyDoesExist: true
    }),
    contactEditingPermissionChanged: state => ({
      ...state,
      isContactEditingAllowed: true
    })
  }
});

export const {
  contactEditingPermissionChanged,
  encryptionKeyHashCreated,
  sessionReseted,
  vaultUnlocked
} = slice.actions;
export const reducer = slice.reducer;
