import { createReducer } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import {
  changeTimeoutDuration,
  refreshTimeout,
  createVault,
  lockVault,
  unlockVault,
  resetVault,
  importAccount,
  removeAccount,
  renameAccount,
  changeActiveAccount
} from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeoutDurationSetting: TimeoutDurationSetting['5 min'],
  lastActivityTime: null,
  accounts: [],
  activeAccountName: null
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
  .handleAction([importAccount], (state, { payload }): State => {
    return {
      ...state,
      accounts: [...state.accounts, payload],
      activeAccountName:
        state.accounts.length === 0 ? payload.name : state.activeAccountName
    };
  })
  .handleAction(changeActiveAccount, (state, { payload }) => ({
    ...state,
    activeAccountName: payload
  }))
  .handleAction(
    [removeAccount],
    (state, { payload: { name } }): State => ({
      ...state,
      accounts: state.accounts.filter(account => account.name !== name),
      activeAccountName:
        state.activeAccountName === name
          ? (state.accounts.length > 1 && state.accounts[0].name) || null
          : state.activeAccountName
    })
  )
  .handleAction(
    [renameAccount],
    (state, { payload: { oldName, newName } }): State => ({
      ...state,
      accounts: state.accounts.map(account => {
        if (account.name === oldName) {
          return {
            ...account,
            name: newName
          };
        }
        return account;
      }),
      activeAccountName:
        state.activeAccountName === oldName ? newName : state.activeAccountName
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
  );
