import { createSelector } from 'reselect';
import { TimeoutDurationSetting } from '@popup/constants';
import { Account } from '@popup/redux/vault/types';
import { RootState } from 'typesafe-actions';

export const selectVaultDoesExist = (state: RootState): boolean =>
  !!state.vault.password;

export const selectVaultHasAccount = (state: RootState): boolean =>
  state.vault.accounts.length > 0;

export const selectVaultAccounts = (state: RootState): Account[] =>
  state.vault.accounts;

const selectAccountName = (_: RootState, accountName: string) => accountName;
export const selectVaultAccountByName = createSelector(
  selectVaultAccounts,
  selectAccountName,
  (accounts, accountName) =>
    accounts.find(account => account.name === accountName)
);

export const selectVaultAccountsNames = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultActiveAccountName = (state: RootState) =>
  state.vault.activeAccountName;
export const selectVaultActiveAccount = createSelector(
  selectVaultAccounts,
  selectVaultActiveAccountName,
  (accounts, activeAccountName) =>
    accounts.find(account => account.name === activeAccountName)
);

const selectActiveTabOrigin = (_: RootState, activeTabOrigin: string | null) =>
  activeTabOrigin;

const selectVaultConnectedAccountsToSite = (state: RootState) =>
  state.vault.connectedAccountsToSites;

export const selectIsSomeAccountConnectedToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultConnectedAccountsToSite,
  (origin, connectedAccountsToSites) =>
    Object.values(connectedAccountsToSites).some(
      sites => origin && sites.includes(origin)
    )
);

export const selectActiveAccountIsConnectedToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultActiveAccountName,
  selectVaultConnectedAccountsToSite,
  (origin, activeAccountName, connectedAccountsToSites) => {
    if (origin === null) {
      return false;
    }

    if (
      activeAccountName === null ||
      !Object.keys(connectedAccountsToSites).includes(activeAccountName)
    ) {
      return false;
    }

    return connectedAccountsToSites[activeAccountName].includes(origin);
  }
);

export const selectConnectedAccountsToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultAccounts,
  selectVaultConnectedAccountsToSite,
  (origin, accounts, connectedAccountsToSites): Account[] => {
    if (origin === null) {
      return [];
    }

    const connectedAccountNames: string[] = Object.entries(
      connectedAccountsToSites
    ).reduce((accountNames: string[], [accountName, sites]) => {
      if (sites.includes(origin)) {
        return [...accountNames, accountName];
      }

      return accountNames;
    }, []);

    return connectedAccountNames
      .map(accountName =>
        accounts.find(account => account.name === accountName)
      )
      .filter((account): account is Account => !!account);
  }
);

export const selectVaultAccountsSecretKeysBase64 = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.secretKey)
);

export const selectVaultIsLocked = (state: RootState): boolean =>
  state.vault.isLocked;

export const selectVaultPassword = (state: RootState): string =>
  state.vault.password || '';

export const selectVaultTimeoutDurationSetting = (
  state: RootState
): TimeoutDurationSetting => state.vault.timeoutDurationSetting;

export const selectVaultLastActivityTime = (state: RootState): number | null =>
  state.vault.lastActivityTime;
