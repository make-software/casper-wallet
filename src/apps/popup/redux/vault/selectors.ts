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

export const selectActiveTabOrigin = (_: RootState, activeTabOrigin: string) =>
  activeTabOrigin;
export const selectActiveAccountIsConnectedToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultActiveAccountName,
  selectVaultAccounts,
  (activeTabOrigin, activeAccountName, accounts) => {
    const activeAccount = accounts.find(
      account => account.name === activeAccountName
    );

    if (
      activeAccountName === null ||
      !activeAccount ||
      activeAccount.connectedToApps?.length === 0
    ) {
      return false;
    }

    return activeAccount.connectedToApps?.includes(activeTabOrigin);
  }
);

export const selectConnectedAccountsToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultAccounts,
  (activeTabOrigin, accounts) =>
    accounts.filter(account =>
      account.connectedToApps?.includes(activeTabOrigin)
    )
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
