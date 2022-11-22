import { createReducer } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import {
  timeoutDurationChanged,
  timeoutRefreshed,
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
  activeOriginChanged,
  accountAdded,
  vaultStateUpdated
} from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  passwordHash: null,
  passwordSaltHash: null,
  keyDerivationSaltHash: null,
  secretPhraseCipher: null,
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
    vaultStateUpdated,
    (state, action): State => ({
      ...state,
      ...action.payload
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
  .handleAction(accountAdded, (state, action): State => {
    const account = action.payload;

    return {
      ...state,
      accounts: [...state.accounts, account],
      activeAccountName: account.name
    };
  })
  .handleAction(accountImported, (state, { payload: account }): State => {
    return {
      ...state,
      accounts: [...state.accounts, account],
      activeAccountName:
        state.accounts.length === 0 ? account.name : state.activeAccountName
    };
  })
  .handleAction(
    accountsConnected,
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
    accountRemoved,
    (state, { payload: { accountName } }): State => {
      const newAccounts = state.accounts.filter(
        account => account.name !== accountName
      );

      const newActiveAccount =
        state.activeAccountName === accountName
          ? (state.accounts.length > 1 && newAccounts[0].name) || null
          : state.activeAccountName;

      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict)
          // when last account for origin, remove group
          .filter(
            ([origin, names]) =>
              !(names.includes(accountName) && names.length === 1)
          )
          // otherwise just remove single account
          .map(([origin, names]) => [
            origin,
            names.filter(name => name !== accountName)
          ])
      );

      return {
        ...state,
        accounts: newAccounts,
        activeAccountName: newActiveAccount,
        accountNamesByOriginDict: newAccountNamesByOriginDict
      };
    }
  )
  .handleAction(
    [accountDisconnected],
    (state, { payload: { siteOrigin, accountName } }) => {
      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict)
          // when last account for origin, remove group
          .filter(
            ([origin, names]) =>
              !(
                origin === siteOrigin &&
                names.includes(accountName) &&
                names.length === 1
              )
          )
          // otherwise just remove single account
          .map(([origin, names]) => [
            origin,
            origin === siteOrigin
              ? names.filter(name => name !== accountName)
              : names
          ])
      );
      return {
        ...state,
        accountNamesByOriginDict: newAccountNamesByOriginDict
      };
    }
  )
  .handleAction(
    [allAccountsDisconnected],
    (state, { payload: { siteOrigin } }) => ({
      ...state,
      accountNamesByOriginDict: Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict).filter(
          ([origin]) => origin !== siteOrigin
        )
      )
    })
  )

  .handleAction(
    [accountRenamed],
    (state, { payload: { oldName, newName } }): State => {
      const newAccountNamesByOriginDict = Object.fromEntries(
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
        accountNamesByOriginDict: newAccountNamesByOriginDict
      };
    }
  )
  .handleAction(activeAccountChanged, (state, { payload }) => ({
    ...state,
    activeAccountName: payload
  }))
  .handleAction(activeOriginChanged, (state, { payload }) => ({
    ...state,
    activeOrigin: payload
  }))
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
  );
