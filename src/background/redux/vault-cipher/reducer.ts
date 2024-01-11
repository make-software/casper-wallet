import { createReducer } from 'typesafe-actions';

import { vaultCipherCreated, vaultCipherReseted } from './actions';
import { VaultCipherState } from './types';

const initialState = null as VaultCipherState;

export const reducer = createReducer(initialState)
  .handleAction(vaultCipherReseted, (): VaultCipherState => initialState)
  .handleAction(
    vaultCipherCreated,
    (state, action): VaultCipherState => action.payload.vaultCipher
  );
