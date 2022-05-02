import { createReducer } from 'typesafe-actions';

import {
  changeTimeout,
  createAccount,
  createVault,
  lockVault,
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
    (state, { payload: { password, timeoutStartTime } }): State => ({
      ...state,
      password,
      timeoutStartTime
    })
  )
  .handleAction(
    lockVault,
    (state, { payload }): State => ({
      ...state,
      isLocked: true,
      timeoutStartTime: null
    })
  )
  .handleAction(
    unlockVault,
    (state, { payload: { timeoutStartTime } }): State => ({
      ...state,
      timeoutStartTime,
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
    (state, { payload: { timeoutDuration, timeoutStartTime } }): State => ({
      ...state,
      timeoutDuration,
      timeoutStartTime
    })
  );
