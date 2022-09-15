import { createSelector } from 'reselect';
import { TimeoutDurationSetting } from '~src/libs/redux/vault/types';
import { Account } from '~src/libs/redux/vault/types';
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

export const selectVaultActiveOrigin = (state: RootState) =>
  state.vault.activeOrigin;

export const selectVaultActiveAccountName = (state: RootState) => {
  const activeAccountName = state.vault.activeAccountName;
  return activeAccountName;
};

export const selectVaultActiveAccount = createSelector(
  selectVaultAccounts,
  selectVaultActiveAccountName,
  (accounts, activeAccountName) => {
    const activeAccount = accounts.find(
      account => account.name === activeAccountName
    );
    return activeAccount;
  }
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

export const selectIsAnyAccountConnectedWithOrigin = createSelector(
  selectVaultActiveOrigin,
  selectVaultAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    Boolean(origin && origin in accountNamesByOriginDict)
);

export const selectIsActiveAccountConnectedWithOrigin = createSelector(
  selectVaultActiveOrigin,
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
  selectVaultActiveOrigin,
  selectVaultAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    origin != null && accountNamesByOriginDict[origin]?.length > 0
      ? accountNamesByOriginDict[origin]
      : []
);

export const selectConnectedAccountsWithOrigin = createSelector(
  selectVaultActiveOrigin,
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
