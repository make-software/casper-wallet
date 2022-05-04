import { createReducer } from 'typesafe-actions';

import {
  changeTimeoutDuration,
  createAccount,
  createVault,
  lockVault,
  unlockVault,
  resetVault
} from './actions';
import { VaultState } from './types';
import { TimeoutDurationSetting } from '@src/app/constants';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeoutDurationSetting: TimeoutDurationSetting['5 min'],
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
  .handleAction([resetVault], () => initialState)
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
    [changeTimeoutDuration],
    (state, { payload: { timeoutDuration, timeoutStartTime } }): State => ({
      ...state,
      timeoutDurationSetting: timeoutDuration,
      timeoutStartTime
    })
  );
