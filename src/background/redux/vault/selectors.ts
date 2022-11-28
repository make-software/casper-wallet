import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import { TimeoutDurationSetting } from '@popup/constants';
import { Account, VaultState } from '@src/background/redux/vault/types';
import { SecretPhrase } from '@src/libs/crypto';
import { selectActiveOrigin } from '../session/selectors';

export const selectVault = (state: RootState): VaultState => state.vault;

export const selectVaultDoesExist = (state: RootState): boolean =>
  !!state.keys.passwordHash;

export const selectVaultHasAccount = (state: RootState): boolean =>
  state.vault.accounts.length > 0;

export const selectVaultAccounts = (state: RootState): Account[] =>
  state.vault.accounts;

export const selectSecretPhrase = (state: RootState): null | SecretPhrase =>
  state.vault.secretPhrase;

export const selectVaultAccountsNames = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultImportedAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.filter(account => account.imported)
);

export const selectVaultHasImportedAccount = createSelector(
  selectVaultImportedAccounts,
  importedAccounts => importedAccounts.length > 0
);

export const selectVaultDerivedAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.filter(account => !account.imported)
);

const withAccountName = (_: RootState, accountName: string) => accountName;
export const selectVaultAccountWithName = createSelector(
  selectVaultAccounts,
  withAccountName,
  (accounts, accountName) =>
    accounts.find(account => account.name === accountName)
);

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
  selectActiveOrigin,
  selectVaultAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    Boolean(origin && origin in accountNamesByOriginDict)
);

export const selectIsActiveAccountConnectedWithOrigin = createSelector(
  selectActiveOrigin,
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
  selectActiveOrigin,
  selectVaultAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    origin != null && accountNamesByOriginDict[origin]?.length > 0
      ? accountNamesByOriginDict[origin]
      : []
);

export const selectConnectedAccountsWithOrigin = createSelector(
  selectActiveOrigin,
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

export const selectCountOfConnectedAccounts = createSelector(
  selectConnectedAccountsWithOrigin,
  connectedAccounts => connectedAccounts.length
);

export const selectVaultCountOfAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.length
);

export const selectCountOfConnectedSites = createSelector(
  selectVaultAccountNamesByOriginDict,
  accountNamesByOriginDict => Object.keys(accountNamesByOriginDict).length
);

export const selectVaultAccountsSecretKeysBase64 = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.secretKey)
);

export const selectVaultTimeoutDurationSetting = (
  state: RootState
): TimeoutDurationSetting => state.vault.timeoutDurationSetting;
