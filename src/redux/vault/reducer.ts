import { createReducer } from 'typesafe-actions';

import { createVault, createAccount, lockVault, unlockVault } from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  accounts: []
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
  )
  .handleAction([createAccount], (state, { payload: { name } }): State => {
    return {
      ...state,
      accounts: [...state.accounts, { name, balance: null }]
    };
  });
