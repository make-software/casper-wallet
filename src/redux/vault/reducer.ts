import { createReducer } from 'typesafe-actions';

import {
  createVault,
  createAccount,
  lockVault,
  unlockVault,
  changeTimeout,
  startTimeout,
  clearTimeout,
  resetVault
} from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeout: '5min',
  timeoutStartFrom: null,
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
  .handleAction([resetVault], () => initialState)
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
  .handleAction(
    [createAccount],
    (state, { payload: { name } }): State => ({
      ...state,
      accounts: [...state.accounts, { name, balance: null }]
    })
  )
  .handleAction(
    [changeTimeout],
    (state, { payload: { timeout } }): State => ({
      ...state,
      timeout
    })
  )
  .handleAction([startTimeout], (state: State) => ({
    ...state,
    timeoutStartFrom: Date.now()
  }))
  .handleAction([clearTimeout], (state: State) => ({
    ...state,
    timeoutStartFrom: null
  }));
