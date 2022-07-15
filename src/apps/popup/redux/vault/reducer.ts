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
  changeActiveAccount,
  connectAccountToApp,
  disconnectAccountsFromApp
} from './actions';
import { Account, VaultState } from './types';

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
      accounts: [
        ...state.accounts,
        { ...payload, connectedToApps: [] } as Account
      ],
      activeAccountName:
        state.accounts.length === 0 ? payload.name : state.activeAccountName
    };
  })
  .handleAction(changeActiveAccount, (state, { payload }) => ({
    ...state,
    activeAccountName: payload
  }))
  .handleAction([removeAccount], (state, { payload: { name } }): State => {
    const nextAccountsState = state.accounts.filter(
      account => account.name !== name
    );

    return {
      ...state,
      accounts: nextAccountsState,
      activeAccountName:
        state.activeAccountName === name
          ? (state.accounts.length > 1 && nextAccountsState[0].name) || null
          : state.activeAccountName
    };
  })
  .handleAction(
    [renameAccount],
    (state, { payload: { oldName, newName } }): State => {
      return {
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
          state.activeAccountName === oldName
            ? newName
            : state.activeAccountName
      };
    }
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
  .handleAction(
    [connectAccountToApp],
    (state, { payload: { appOrigin, accountName } }) => ({
      ...state,
      accounts: state.accounts.map(account => {
        if (account.name !== accountName) {
          return account;
        }

        return {
          ...account,
          connectedToApps:
            account.connectedToApps?.length > 0
              ? account.connectedToApps.includes(appOrigin)
                ? account.connectedToApps
                : [...account.connectedToApps, appOrigin]
              : [appOrigin]
        };
      })
    })
  )
  .handleAction(
    [disconnectAccountsFromApp],
    (state, { payload: { appOrigin } }) => ({
      ...state,
      accounts: state.accounts.map(account => ({
        ...account,
        connectedToApps: account.connectedToApps.filter(
          connectedAppOrigin => connectedAppOrigin !== appOrigin
        )
      }))
    })
  );
