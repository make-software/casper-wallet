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
  connectedAccountsToSites: {},
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
  .handleAction([removeAccount], (state, { payload: { name } }): State => {
    const nextAccountsState = state.accounts.filter(
      account => account.name !== name
    );
    const nextConnectedAccountsToSites = Object.fromEntries(
      Object.entries(state.connectedAccountsToSites).filter(
        ([accountName]) => accountName !== name
      )
    );

    return {
      ...state,
      accounts: nextAccountsState,
      activeAccountName:
        state.activeAccountName === name
          ? (state.accounts.length > 1 && nextAccountsState[0].name) || null
          : state.activeAccountName,
      connectedAccountsToSites: nextConnectedAccountsToSites
    };
  })
  .handleAction(
    [renameAccount],
    (state, { payload: { oldName, newName } }): State => {
      const nextConnectedAccountsToSites = Object.fromEntries(
        Object.entries(state.connectedAccountsToSites).map(
          ([accountName, sites]) =>
            accountName === oldName ? [newName, sites] : [accountName, sites]
        )
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
        connectedAccountsToSites: nextConnectedAccountsToSites
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
    (state, { payload: { appOrigin, accountName } }) => ({
      ...state,
      connectedAccountsToSites: {
        ...state.connectedAccountsToSites,
        [accountName]:
          accountName in state.connectedAccountsToSites
            ? [...state.connectedAccountsToSites[accountName], appOrigin]
            : [appOrigin]
      }
    })
  )
  .handleAction(
    [disconnectAllAccountsFromSite],
    (state, { payload: { appOrigin } }) => ({
      ...state,
      connectedAccountsToSites: Object.fromEntries(
        Object.entries(state.connectedAccountsToSites).map(
          ([accountName, sites]) => [
            accountName,
            sites.filter(siteOrigin => siteOrigin !== appOrigin)
          ]
        )
      )
    })
  );
