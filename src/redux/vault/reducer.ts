import { createReducer } from 'typesafe-actions';

import { createVault, lockVault, unlockVault } from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false
};

export const reducer = createReducer(initialState)
  .handleAction(
    [createVault],
    (state, { payload: { password } }): State => ({
      ...state,
      password
    })
  )
  .handleAction(
    lockVault,
    (state, { payload }): State => ({
      ...state,
      isLocked: true
    })
  )
  .handleAction(
    unlockVault,
    (state, { payload }): State => ({
      ...state,
      isLocked: false
    })
  );
