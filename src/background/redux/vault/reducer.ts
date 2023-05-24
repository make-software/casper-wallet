import { createReducer } from 'typesafe-actions';

import {
  vaultReseted,
  vaultLoaded,
  secretPhraseCreated,
  accountAdded,
  accountImported,
  accountRemoved,
  accountRenamed,
  siteConnected,
  accountDisconnected,
  siteDisconnected,
  activeAccountChanged,
  anotherAccountConnected,
  deploysReseted,
  deployPayloadReceived
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
      }
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
    (state, action): State => ({
      ...state,
      secretPhrase: action.payload
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
            ([origin, names = []]) =>
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
    (state, { payload: { oldName, newName } }): State => {
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
    (state, { payload: { siteOrigin, accountNames, siteTitle } }) => ({
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
    (state, { payload: { siteOrigin, accountName } }) => ({
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
    (state, { payload: { siteOrigin, accountName } }) => {
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
  .handleAction(siteDisconnected, (state, { payload: { siteOrigin } }) => ({
    ...state,
    accountNamesByOriginDict: Object.fromEntries(
      Object.entries(state.accountNamesByOriginDict).filter(
        ([origin]) => origin !== siteOrigin
      )
    )
  }))
  .handleAction(activeAccountChanged, (state, { payload }) => ({
    ...state,
    activeAccountName: payload
  }))
  .handleAction(deploysReseted, (): State => initialState)
  .handleAction(
    deployPayloadReceived,
    (state, { payload }): State => ({
      ...state,
      jsonById: { [payload.id]: payload.json }
    })
  );
