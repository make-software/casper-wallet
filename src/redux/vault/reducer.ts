import { createReducer } from 'typesafe-actions';

import {
  changeTimeout,
  clearTimeout,
  createAccount,
  createVault,
  lockVault,
  startTimeout,
  unlockVault
} from './actions';
import { VaultState } from './types';
import { Timeout } from '@src/app/types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeoutDuration: Timeout['5 min'],
  timeoutStartTime: null,
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
  .handleAction(
    [createAccount],
    (state, { payload: { name } }): State => ({
      ...state,
      accounts: [...state.accounts, { name, balance: null }]
    })
  )
  .handleAction(
    [changeTimeout],
    (state, { payload: { timeoutDuration } }): State => ({
      ...state,
      timeoutDuration
    })
  )
  .handleAction(
    [startTimeout],
    (state: State, { payload: { timeoutStartTime } }) => ({
      ...state,
      timeoutStartTime
    })
  )
  .handleAction([clearTimeout], (state: State) => ({
    ...state,
    timeoutStartTime: null
  }));
