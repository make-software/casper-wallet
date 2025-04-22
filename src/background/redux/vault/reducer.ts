import { createReducer } from 'typesafe-actions';

import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsAdded,
  accountsImported,
  activeAccountChanged,
  activeAccountSupportsChanged,
  addWatchingAccount,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted,
  hideAccountFromListChanged,
  secretPhraseCreated,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} from './actions';
import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  secretPhrase: null,
  accounts: [],
  accountNamesByOriginDict: {},
  siteNameByOriginDict: {},
  activeAccountName: null,
  jsonById: {}
};

export const reducer = createReducer(initialState)
  .handleAction(vaultReseted, () => initialState)
  .handleAction(
    vaultLoaded,
    (
      state,
      {
        payload: {
          accountNamesByOriginDict,
          siteNameByOriginDict,
          accounts,
          activeAccountName,
          secretPhrase,
          jsonById
        }
      }: ReturnType<typeof vaultLoaded>
    ) => ({
      accountNamesByOriginDict,
      siteNameByOriginDict,
      accounts,
      activeAccountName,
      secretPhrase,
      jsonById:
        Object.keys(state.jsonById).length === 0 ? jsonById : state.jsonById
    })
  )
  .handleAction(
    secretPhraseCreated,
    (state, action: ReturnType<typeof secretPhraseCreated>): State => ({
      ...state,
      secretPhrase: action.payload
    })
  )
  .handleAction(
    accountAdded,
    (state, action: ReturnType<typeof accountAdded>): State => {
      const account = action.payload;

      return {
        ...state,
        accounts: [...state.accounts, account],
        activeAccountName: account.name
      };
    }
  )
  .handleAction(
    accountImported,
    (
      state,
      { payload: account }: ReturnType<typeof accountImported>
    ): State => ({
      ...state,
      accounts: [...state.accounts, account],
      activeAccountName:
        state.accounts.length === 0 ? account.name : state.activeAccountName
    })
  )
  .handleAction(
    accountsAdded,
    (state, { payload: accounts }: ReturnType<typeof accountsAdded>) => ({
      ...state,
      accounts: [...state.accounts, ...accounts],
      activeAccountName:
        state.accounts.length === 0 ? accounts[0].name : state.activeAccountName
    })
  )
  .handleAction(
    accountsImported,
    (state, { payload: accounts }: ReturnType<typeof accountsImported>) => ({
      ...state,
      accounts: [...state.accounts, ...accounts],
      activeAccountName:
        state.accounts.length === 0 ? accounts[0].name : state.activeAccountName
    })
  )
  .handleAction(
    accountRemoved,
    (
      state,
      { payload: { accountName } }: ReturnType<typeof accountRemoved>
    ): State => {
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
            ([, names = []]) =>
              !(names.includes(accountName) && names.length === 1)
          )
          // otherwise just remove single account
          .map(([origin, names = []]) => [
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
    accountRenamed,
    (
      state,
      { payload: { oldName, newName } }: ReturnType<typeof accountRenamed>
    ): State => {
      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.keys(state.accountNamesByOriginDict).map(origin => [
          origin,
          (state.accountNamesByOriginDict[origin] || []).map(accountName =>
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
  .handleAction(
    siteConnected,
    (
      state,
      {
        payload: { siteOrigin, accountNames, siteTitle }
      }: ReturnType<typeof siteConnected>
    ) => ({
      ...state,
      siteNameByOriginDict: {
        ...state?.siteNameByOriginDict,
        [siteOrigin]: siteTitle
      },
      accountNamesByOriginDict: {
        ...state.accountNamesByOriginDict,
        [siteOrigin]:
          (state.accountNamesByOriginDict[siteOrigin] || []).length > 0
            ? [
                ...(state.accountNamesByOriginDict[siteOrigin] || []),
                ...accountNames
              ]
            : [...accountNames]
      }
    })
  )
  .handleAction(
    anotherAccountConnected,
    (
      state,
      {
        payload: { siteOrigin, accountName }
      }: ReturnType<typeof anotherAccountConnected>
    ) => ({
      ...state,
      accountNamesByOriginDict: {
        ...state.accountNamesByOriginDict,
        [siteOrigin]:
          (state.accountNamesByOriginDict[siteOrigin] || []).length > 0
            ? [
                ...(state.accountNamesByOriginDict[siteOrigin] || []),
                accountName
              ]
            : [accountName]
      }
    })
  )
  .handleAction(
    accountDisconnected,
    (
      state,
      {
        payload: { siteOrigin, accountName }
      }: ReturnType<typeof accountDisconnected>
    ) => {
      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict)
          // when last account for origin, remove group
          .filter(
            ([origin, names = []]) =>
              !(
                origin === siteOrigin &&
                names.includes(accountName) &&
                names.length === 1
              )
          )
          // otherwise just remove single account
          .map(([origin, names = []]) => [
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
    siteDisconnected,
    (
      state,
      { payload: { siteOrigin } }: ReturnType<typeof siteDisconnected>
    ) => ({
      ...state,
      accountNamesByOriginDict: Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict).filter(
          ([origin]) => origin !== siteOrigin
        )
      )
    })
  )
  .handleAction(
    activeAccountChanged,
    (state, { payload }: ReturnType<typeof activeAccountChanged>) => ({
      ...state,
      activeAccountName: payload
    })
  )
  .handleAction(
    activeAccountSupportsChanged,
    (state, { payload }: ReturnType<typeof activeAccountSupportsChanged>) => ({
      ...state,
      accounts: state.accounts.map(account => {
        if (account.name === state.activeAccountName) {
          return {
            ...account,
            supports: payload
          };
        } else {
          return account;
        }
      })
    })
  )
  .handleAction(deploysReseted, (): State => initialState)
  .handleAction(
    deployPayloadReceived,
    (state, { payload }: ReturnType<typeof deployPayloadReceived>): State => ({
      ...state,
      jsonById: { [payload.id]: payload.json }
    })
  )
  .handleAction(
    hideAccountFromListChanged,
    (
      state,
      {
        payload: { accountName }
      }: ReturnType<typeof hideAccountFromListChanged>
    ) => {
      const visibleAccounts = state.accounts.filter(
        account => !account.hidden && account.name !== accountName
      );

      const newActiveAccount =
        state.activeAccountName === accountName
          ? (state.accounts.length > 1 && visibleAccounts[0].name) || null
          : state.activeAccountName;

      return {
        ...state,
        activeAccountName: newActiveAccount,
        accounts: state.accounts.map(account => {
          if (account.name === accountName) {
            return {
              ...account,
              hidden: !account.hidden
            };
          }

          return account;
        })
      };
    }
  )
  .handleAction(
    addWatchingAccount,
    (state, action: ReturnType<typeof addWatchingAccount>): State => {
      const account = action.payload;

      return {
        ...state,
        accounts: [...state.accounts, account],
        activeAccountName: account.name
      };
    }
  );
