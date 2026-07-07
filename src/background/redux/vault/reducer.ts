import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { CasperWalletSupports } from '@content/sdk-types';

import { SecretPhrase } from '@libs/crypto';
import { Account } from '@libs/types/account';

import { VaultState } from './types';

type State = VaultState;

const initialState: State = {
  secretPhrase: null,
  accounts: [],
  accountNamesByOriginDict: {},
  siteNameByOriginDict: {},
  activeAccountName: null,
  jsonById: {},
  eip712ById: {}
};

const slice = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    vaultReseted: () => initialState,
    vaultLoaded: (
      state,
      {
        payload: {
          accountNamesByOriginDict,
          siteNameByOriginDict,
          accounts,
          activeAccountName,
          secretPhrase,
          jsonById,
          eip712ById
        }
      }: PayloadAction<VaultState>
    ) => ({
      accountNamesByOriginDict,
      siteNameByOriginDict,
      accounts,
      activeAccountName,
      secretPhrase,
      jsonById:
        Object.keys(state.jsonById).length === 0 ? jsonById : state.jsonById,
      eip712ById:
        Object.keys(state.eip712ById).length === 0
          ? eip712ById
          : state.eip712ById
    }),
    secretPhraseCreated: (
      state,
      action: PayloadAction<SecretPhrase>
    ): State => ({
      ...state,
      secretPhrase: action.payload
    }),
    accountAdded: (state, action: PayloadAction<Account>): State => {
      const account = action.payload;

      return {
        ...state,
        accounts: [...state.accounts, account],
        activeAccountName: account.name
      };
    },
    accountImported: (
      state,
      { payload: account }: PayloadAction<Account>
    ): State => ({
      ...state,
      accounts: [...state.accounts, account],
      activeAccountName:
        state.accounts.length === 0 ? account.name : state.activeAccountName
    }),
    accountsAdded: (
      state,
      { payload: accounts }: PayloadAction<Account[]>
    ) => ({
      ...state,
      accounts: [...state.accounts, ...accounts],
      activeAccountName:
        state.accounts.length === 0 ? accounts[0].name : state.activeAccountName
    }),
    accountsImported: (
      state,
      { payload: accounts }: PayloadAction<Account[]>
    ) => ({
      ...state,
      accounts: [...state.accounts, ...accounts],
      activeAccountName:
        state.accounts.length === 0 ? accounts[0].name : state.activeAccountName
    }),
    accountRemoved: (
      state,
      { payload: { accountName } }: PayloadAction<{ accountName: string }>
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
    },
    accountRenamed: (
      state,
      {
        payload: { oldName, newName }
      }: PayloadAction<{ oldName: string; newName: string }>
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
    },
    siteConnected: (
      state,
      {
        payload: { siteOrigin, accountNames, siteTitle }
      }: PayloadAction<{
        siteOrigin: string;
        accountNames: string[];
        siteTitle: string;
      }>
    ) => {
      // Behaviour-identical to the verbatim body: the original spread the same
      // `... || []` expression twice, leaving a dead `|| []` branch inside the
      // truthy path (and a defensive `state?.` that never short-circuits since
      // `state` is always defined). Hoisting to a single const preserves
      // semantics and lets the one remaining `|| []` branch be exercised.
      // (ts-jest strips inline `istanbul ignore` comments, so annotation was
      // not viable here.)
      const existingNames = state.accountNamesByOriginDict[siteOrigin] || [];

      return {
        ...state,
        siteNameByOriginDict: {
          ...state.siteNameByOriginDict,
          [siteOrigin]: siteTitle
        },
        accountNamesByOriginDict: {
          ...state.accountNamesByOriginDict,
          [siteOrigin]:
            existingNames.length > 0
              ? [...existingNames, ...accountNames]
              : [...accountNames]
        }
      };
    },
    anotherAccountConnected: (
      state,
      {
        payload: { siteOrigin, accountName }
      }: PayloadAction<{ siteOrigin: string; accountName: string }>
    ) => {
      // See siteConnected: hoist the duplicated `... || []` to eliminate the
      // dead second `|| []` branch while preserving behaviour.
      const existingNames = state.accountNamesByOriginDict[siteOrigin] || [];

      return {
        ...state,
        accountNamesByOriginDict: {
          ...state.accountNamesByOriginDict,
          [siteOrigin]:
            existingNames.length > 0
              ? [...existingNames, accountName]
              : [accountName]
        }
      };
    },
    accountDisconnected: (
      state,
      {
        payload: { siteOrigin, accountName }
      }: PayloadAction<{ accountName: string; siteOrigin: string }>
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
    },
    siteDisconnected: (
      state,
      { payload: { siteOrigin } }: PayloadAction<{ siteOrigin: string }>
    ) => ({
      ...state,
      accountNamesByOriginDict: Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict).filter(
          ([origin]) => origin !== siteOrigin
        )
      )
    }),
    activeAccountChanged: (state, { payload }: PayloadAction<string>) => ({
      ...state,
      activeAccountName: payload
    }),
    activeAccountSupportsChanged: (
      state,
      { payload }: PayloadAction<CasperWalletSupports[]>
    ) => ({
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
    }),
    deploysReseted: (): State => initialState,
    deployPayloadReceived: (
      state,
      { payload }: PayloadAction<{ id: string; json: string }>
    ): State => ({
      ...state,
      jsonById: { [payload.id]: payload.json }
    }),
    eip712PayloadReceived: (
      state,
      { payload }: PayloadAction<{ id: string; json: string }>
    ): State => ({
      ...state,
      eip712ById: { [payload.id]: payload.json }
    }),
    hideAccountFromListChanged: (
      state,
      { payload: { accountName } }: PayloadAction<{ accountName: string }>
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
    },
    addWatchingAccount: (state, action: PayloadAction<Account>): State => {
      const account = action.payload;

      return {
        ...state,
        accounts: [...state.accounts, account],
        activeAccountName: account.name
      };
    }
  }
});

export const {
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
  eip712PayloadReceived,
  hideAccountFromListChanged,
  secretPhraseCreated,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} = slice.actions;
export const reducer = slice.reducer;
