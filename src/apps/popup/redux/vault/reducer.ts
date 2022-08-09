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
  connectAccountToSite,
  disconnectAccountFromSite,
  disconnectAllAccountsFromSite
} from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeoutDurationSetting: TimeoutDurationSetting['5 min'],
  lastActivityTime: null,
  accounts: [],
  accountNamesByOrigin: {},
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
    (state, { payload: { accountName } }): State => {
      const nextAccountsState = state.accounts.filter(
        account => account.name !== accountName
      );

      const nextAccountNamesByOrigin = Object.fromEntries(
        Object.keys(state.accountNamesByOrigin).map(origin => [
          origin,
          state.accountNamesByOrigin[origin].filter(
            name => accountName !== name
          )
        ])
      );

      return {
        ...state,
        accounts: nextAccountsState,
        activeAccountName:
          state.activeAccountName === accountName
            ? (state.accounts.length > 1 && nextAccountsState[0].name) || null
            : state.activeAccountName,
        accountNamesByOrigin: nextAccountNamesByOrigin
      };
    }
  )
  .handleAction(
    [renameAccount],
    (state, { payload: { oldName, newName } }): State => {
      const nextAccountNamesByOrigin = Object.fromEntries(
        Object.keys(state.accountNamesByOrigin).map(origin => [
          origin,
          state.accountNamesByOrigin[origin].map(accountName =>
            accountName === oldName ? newName : accountName
          )
        ])
      );

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
            : state.activeAccountName,
        accountNamesByOrigin: nextAccountNamesByOrigin
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
    [connectAccountToSite],
    (state, { payload: { siteOrigin, accountName } }) => ({
      ...state,
      accountNamesByOrigin: {
        ...state.accountNamesByOrigin,
        [siteOrigin]:
          state.accountNamesByOrigin[siteOrigin]?.length > 0
            ? [...state.accountNamesByOrigin[siteOrigin], accountName]
            : [accountName]
      }
    })
  )
  .handleAction(
    [disconnectAccountFromSite],
    (state, { payload: { accountName, siteOrigin } }) => ({
      ...state,
      accountNamesByOrigin: Object.fromEntries(
        Object.entries({ ...state.accountNamesByOrigin }).map(
          ([origin, accountNames]) =>
            origin === siteOrigin
              ? [origin, accountNames.filter(name => name !== accountName)]
              : [origin, accountNames]
        )
      )
    })
  )
  .handleAction(
    [disconnectAllAccountsFromSite],
    (state, { payload: { siteOrigin } }) => ({
      ...state,
      accountNamesByOrigin: Object.fromEntries(
        Object.entries({ ...state.accountNamesByOrigin }).filter(
          ([origin]) => origin !== siteOrigin
        )
      )
    })
  );
