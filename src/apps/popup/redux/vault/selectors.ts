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

export const selectVaultAccountsNames = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.name)
);

const withAccountName = (_: RootState, accountName: string) => accountName;
export const selectVaultAccountWithName = createSelector(
  selectVaultAccounts,
  withAccountName,
  (accounts, accountName) =>
    accounts.find(account => account.name === accountName)
);

export const selectVaultActiveAccountName = (state: RootState) =>
  state.vault.activeAccountName;
export const selectVaultActiveAccount = createSelector(
  selectVaultAccounts,
  selectVaultActiveAccountName,
  (accounts, activeAccountName) =>
    accounts.find(account => account.name === activeAccountName)
);

export const selectVaultAccountNamesByOriginDict = (state: RootState) =>
  state.vault.accountNamesByOriginDict;

export const selectVaultAccountsByOriginDict = createSelector(
  selectVaultAccountNamesByOriginDict,
  selectVaultAccounts,
  (accountNamesByOriginDict, accounts): Record<string, Account[]> => {
    return Object.fromEntries(
      Object.entries(accountNamesByOriginDict).map(([origin, accountNames]) => [
        origin,
        accountNames
          .map(accountName => {
            const account = accounts.find(
              account => account.name === accountName
            );

            if (account == null) {
              return null;
            }

            return account;
          })
          .filter(
            (accountNamesAndPublicKeys): accountNamesAndPublicKeys is Account =>
              accountNamesAndPublicKeys != null
          )
      ])
    );
  }
);

const withActiveTabOrigin = (_: RootState, activeTabOrigin: string | null) =>
  activeTabOrigin;

export const selectIsAnyAccountConnectedWithOrigin = createSelector(
  withActiveTabOrigin,
  selectVaultAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    origin && origin in accountNamesByOriginDict
);

export const selectIsActiveAccountConnectedWithOrigin = createSelector(
  withActiveTabOrigin,
  selectVaultActiveAccountName,
  selectVaultAccountNamesByOriginDict,
  (origin, activeAccountName, accountNamesByOriginDict) => {
    if (
      origin === null ||
      activeAccountName === null ||
      accountNamesByOriginDict[origin] == null
    ) {
      return false;
    }

    return accountNamesByOriginDict[origin].includes(activeAccountName);
  }
);

export const selectConnectedAccountNamesWithOrigin = createSelector(
  withActiveTabOrigin,
  selectVaultAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    origin != null && accountNamesByOriginDict[origin]?.length > 0
      ? accountNamesByOriginDict[origin]
      : []
);

export const selectConnectedAccountsWithOrigin = createSelector(
  withActiveTabOrigin,
  selectVaultAccounts,
  selectConnectedAccountNamesWithOrigin,
  (origin, accounts, connectedAccountNamesToOrigin): Account[] => {
    return connectedAccountNamesToOrigin
      .map(accountName =>
        accounts.find(account => account.name === accountName)
      )
      .filter((account): account is Account => !!account);
  }
);

export const selectCountOfConnectedSites = createSelector(
  selectVaultAccountNamesByOriginDict,
  accountNamesByOriginDict => Object.keys(accountNamesByOriginDict).length
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
