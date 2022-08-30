import { createReducer } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import {
  timeoutDurationChanged,
  timeoutRefreshed,
  vaultCreated,
  vaultLocked,
  vaultUnlocked,
  vaultReseted,
  accountImported,
  accountRemoved,
  accountRenamed,
  activeAccountChanged,
  accountsConnected,
  accountDisconnected,
  allAccountsDisconnected,
  activeOriginChanged
} from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  password: null,
  isLocked: false,
  timeoutDurationSetting: TimeoutDurationSetting['5 min'],
  lastActivityTime: null,
  accounts: [],
  accountNamesByOriginDict: {},
  activeAccountName: null,
  activeOrigin: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    [vaultCreated],
    (state, { payload: { password, lastActivityTime } }): State => ({
      ...state,
      password,
      lastActivityTime
    })
  )
  .handleAction([vaultReseted], () => initialState)
  .handleAction(
    vaultLocked,
    (state, { payload }): State => ({
      ...state,
      isLocked: true,
      lastActivityTime: null
    })
  )
  .handleAction(
    vaultUnlocked,
    (state, { payload: { lastActivityTime } }): State => ({
      ...state,
      lastActivityTime,
      isLocked: false
    })
  )
  .handleAction([accountImported], (state, { payload }): State => {
    return {
      ...state,
      accounts: [...state.accounts, payload],
      activeAccountName:
        state.accounts.length === 0 ? payload.name : state.activeAccountName
    };
  })
  .handleAction(activeAccountChanged, (state, { payload }) => ({
    ...state,
    activeAccountName: payload
  }))
  .handleAction(activeOriginChanged, (state, { payload }) => ({
    ...state,
    activeOrigin: payload
  }))
  .handleAction(
    [accountRemoved],
    (state, { payload: { accountName } }): State => {
      const nextAccountsState = state.accounts.filter(
        account => account.name !== accountName
      );

      const nextAccountNamesByOriginDict = Object.fromEntries(
        Object.keys(state.accountNamesByOriginDict).map(origin => [
          origin,
          state.accountNamesByOriginDict[origin].filter(
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
        accountNamesByOriginDict: nextAccountNamesByOriginDict
      };
    }
  )
  .handleAction(
    [accountRenamed],
    (state, { payload: { oldName, newName } }): State => {
      const nextAccountNamesByOriginDict = Object.fromEntries(
        Object.keys(state.accountNamesByOriginDict).map(origin => [
          origin,
          state.accountNamesByOriginDict[origin].map(accountName =>
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
        accountNamesByOriginDict: nextAccountNamesByOriginDict
      };
    }
  )
  .handleAction(
    [timeoutDurationChanged],
    (state, { payload: { timeoutDuration, lastActivityTime } }): State => ({
      ...state,
      timeoutDurationSetting: timeoutDuration,
      lastActivityTime
    })
  )
  .handleAction(
    [timeoutRefreshed],
    (state, { payload: { lastActivityTime } }) => ({
      ...state,
      lastActivityTime
    })
  )
  .handleAction(
    [accountsConnected],
    (state, { payload: { siteOrigin, accountNames } }) => ({
      ...state,
      accountNamesByOriginDict: {
        ...state.accountNamesByOriginDict,
        [siteOrigin]:
          state.accountNamesByOriginDict[siteOrigin]?.length > 0
            ? [...state.accountNamesByOriginDict[siteOrigin], ...accountNames]
            : [...accountNames]
      }
    })
  )
  .handleAction(
    [accountDisconnected],
    (state, { payload: { accountName, siteOrigin } }) => ({
      ...state,
      accountNamesByOriginDict: Object.fromEntries(
        Object.entries({ ...state.accountNamesByOriginDict }).map(
          ([origin, accountNames]) =>
            origin === siteOrigin
              ? [origin, accountNames.filter(name => name !== accountName)]
              : [origin, accountNames]
        )
      )
    })
  )
  .handleAction(
    [allAccountsDisconnected],
    (state, { payload: { siteOrigin } }) => ({
      ...state,
      accountNamesByOriginDict: Object.fromEntries(
        Object.entries({ ...state.accountNamesByOriginDict }).filter(
          ([origin]) => origin !== siteOrigin
        )
      )
    })
  );
