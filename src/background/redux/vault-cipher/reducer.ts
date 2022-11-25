import { createReducer } from 'typesafe-actions';
import { vaultCipherCreated, vaultCipherReseted } from './actions';

export type VaultCipherState = null | string;

const initialState = null as VaultCipherState;

export const reducer = createReducer(initialState)
  .handleAction(
    vaultCipherReseted,
    (state, action): VaultCipherState => initialState
  )
  .handleAction(
    vaultCipherCreated,
    (state, action): VaultCipherState => action.payload.vaultCipher
  );
