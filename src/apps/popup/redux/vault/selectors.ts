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

export const selectVaultAccountNamesByOrigin = (state: RootState) =>
  state.vault.accountNamesByOrigin;

export const selectIsSomeAccountConnectedToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultAccountNamesByOrigin,
  (origin, accountNamesByOrigin) => origin && origin in accountNamesByOrigin
);

export const selectActiveAccountIsConnectedToOrigin = createSelector(
  selectActiveTabOrigin,
  selectVaultActiveAccountName,
  selectVaultAccountNamesByOrigin,
  (origin, activeAccountName, accountNamesByOrigin) => {
    if (
      origin === null ||
      activeAccountName === null ||
      accountNamesByOrigin[origin] == null
    ) {
      return false;
    }

    return accountNamesByOrigin[origin].includes(activeAccountName);
  }
);

export const selectConnectedAccountNamesToActiveTab = createSelector(
  selectActiveTabOrigin,
  selectVaultAccountNamesByOrigin,
  (origin, accountNamesByOrigin) =>
    origin != null && accountNamesByOrigin[origin]?.length > 0
      ? accountNamesByOrigin[origin]
      : []
);

export const selectConnectedAccountsToActiveTab = createSelector(
  selectActiveTabOrigin,
  selectVaultAccounts,
  selectConnectedAccountNamesToActiveTab,
  (origin, accounts, connectedAccountNamesToOrigin): Account[] => {
    return connectedAccountNamesToOrigin
      .map(accountName =>
        accounts.find(account => account.name === accountName)
      )
      .filter((account): account is Account => !!account);
  }
);

export interface AccountNamesAndPublicKeys {
  id: string;
  name: string;
  publicKey: string;
}

export const selectAccountNamesAndPublicKeysByOrigin = createSelector(
  selectVaultAccountNamesByOrigin,
  selectVaultAccounts,
  (accountNamesByOrigin, accounts) => {
    return Object.fromEntries(
      Object.entries(accountNamesByOrigin).map(([origin, accountNames]) => [
        origin,
        accountNames
          .map(accountName => {
            const account = accounts.find(
              account => account.name === accountName
            );

            if (account === undefined) {
              return null;
            }

            return {
              id: account.name,
              name: account.name,
              publicKey: account.publicKey
            };
          })
          .filter(
            (
              accountNamesAndPublicKeys
            ): accountNamesAndPublicKeys is AccountNamesAndPublicKeys =>
              !!accountNamesAndPublicKeys
          )
      ])
    );
  }
);

export const selectCountOfConnectedSites = createSelector(
  selectVaultAccountNamesByOrigin,
  accountNamesByOrigin => Object.keys(accountNamesByOrigin).length
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
