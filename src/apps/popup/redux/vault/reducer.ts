import { createReducer } from 'typesafe-actions';

import {
  changeTimeoutDuration,
  createAccount,
  createVault,
  lockVault,
  unlockVault,
  resetVault,
  refreshTimeout,
  saveWindowId,
  clearWindowId
} from './actions';
import { VaultState } from './types';
import { TimeoutDurationSetting } from '@popup/constants';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeoutDurationSetting: TimeoutDurationSetting['5 min'],
  lastActivityTime: null,
  accounts: [],
  windowId: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    [createVault],
    (state, { payload: { password, lastActivityTime } }): State => ({
      ...state,
      password,
      lastActivityTime
    })
  )
  .handleAction([resetVault], () => initialState)
  .handleAction(
    lockVault,
    (state, { payload }): State => ({
      ...state,
      isLocked: true,
      lastActivityTime: null
    })
  )
  .handleAction(
    unlockVault,
    (state, { payload: { lastActivityTime } }): State => ({
      ...state,
      lastActivityTime,
      isLocked: false
    })
  )
  .handleAction(
    [createAccount],
    (state, { payload: { name, keyPair, isBackedUp } }): State => ({
      ...state,
      accounts: [...state.accounts, { name, keyPair, isBackedUp }]
    })
  )
  .handleAction(
    [changeTimeoutDuration],
    (state, { payload: { timeoutDuration, lastActivityTime } }): State => ({
      ...state,
      timeoutDurationSetting: timeoutDuration,
      lastActivityTime
    })
  )
  .handleAction(
    [refreshTimeout],
    (state, { payload: { lastActivityTime } }) => ({
      ...state,
      lastActivityTime
    })
  )
  // TODO: move it to separated store part
  .handleAction(
    [saveWindowId],
    (state, { payload }): State => ({
      ...state,
      windowId: payload
    })
  )
  .handleAction(
    clearWindowId,
    (state): State => ({
      ...state,
      windowId: null
    })
  );
