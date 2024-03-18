import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import { VaultState } from '@background/redux/vault/types';

import { SecretPhrase } from '@libs/crypto';
import { Account } from '@libs/types/account';

import { selectActiveOrigin } from '../active-origin/selectors';

export const selectVault = (state: RootState): VaultState => state.vault;

export const selectSiteNameByOriginDict = (state: RootState) =>
  state.vault.siteNameByOriginDict;

export const selectSecretPhrase = (state: RootState): null | SecretPhrase =>
  state.vault.secretPhrase;

export const selectVaultAccounts = (state: RootState): Account[] =>
  state.vault.accounts;

export const selectVaultCountsOfAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.length
);

export const selectVaultHasAccounts = (state: RootState): boolean =>
  state.vault.accounts.length > 0;

export const selectVaultAccountsNames = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultImportedAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.filter(account => account.imported)
);

export const selectVaultImportedAccountNames = createSelector(
  selectVaultImportedAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultVisibleAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.filter(account => !account.hidden)
);

export const selectVaultHiddenAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.filter(account => account.hidden)
);

export const selectVaultHiddenAccountsNames = createSelector(
  selectVaultHiddenAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultHasImportedAccount = createSelector(
  selectVaultImportedAccounts,
  importedAccounts => importedAccounts.length > 0
);

export const selectVaultDerivedAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.filter(account => !account.imported)
);

export const selectVaultAccountsSecretKeysBase64 = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.secretKey)
);

export const selectVaultAccount = createSelector(
  selectVaultAccounts,
  (_: RootState, accountName: string) => accountName,
  (accounts, accountName) =>
    accounts.find(account => account.name === accountName)
);

export const selectVaultActiveAccountName = (state: RootState) =>
  state.vault.activeAccountName;

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

export const selectAccountNamesByOriginDict = (state: RootState) =>
  state.vault.accountNamesByOriginDict;

export const selectAccountsByOriginDict = createSelector(
  selectAccountNamesByOriginDict,
  selectVaultAccounts,
  (accountNamesByOriginDict, accounts): Record<string, Account[]> => {
    return Object.fromEntries(
      Object.entries(accountNamesByOriginDict).map(([origin, accountNames]) => [
        origin,
        (accountNames || [])
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

export const selectIsAccountConnected = createSelector(
  selectAccountNamesByOriginDict,
  (
    _: RootState,
    origin: string | undefined,
    accountName: string | undefined
  ) => [origin, accountName],
  (accountNamesByOriginDict, [origin, accountName]) => {
    const accountNames = origin && accountNamesByOriginDict[origin];
    if (accountNames == null || !accountName) {
      return false;
    }
    return accountNames.includes(accountName);
  }
);

export const selectIsAnyAccountConnectedWithActiveOrigin = createSelector(
  selectActiveOrigin,
  selectAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    Boolean(origin && origin in accountNamesByOriginDict)
);

export const selectIsActiveAccountConnectedWithActiveOrigin = createSelector(
  selectActiveOrigin,
  selectVaultActiveAccountName,
  selectAccountNamesByOriginDict,
  (origin, activeAccountName, accountNamesByOriginDict) => {
    const accountNames = origin && accountNamesByOriginDict[origin];
    if (accountNames == null || activeAccountName == null) {
      return false;
    } else {
      return accountNames.includes(activeAccountName);
    }
  }
);

export const selectConnectedAccountNamesWithActiveOrigin = createSelector(
  selectActiveOrigin,
  selectAccountNamesByOriginDict,
  (origin, accountNamesByOriginDict) =>
    origin != null && (accountNamesByOriginDict[origin] || []).length > 0
      ? accountNamesByOriginDict[origin]
      : []
);

export const selectConnectedAccountsWithActiveOrigin = createSelector(
  selectActiveOrigin,
  selectVaultAccounts,
  selectConnectedAccountNamesWithActiveOrigin,
  (origin, accounts, connectedAccountNamesWithOrigin): Account[] => {
    return (connectedAccountNamesWithOrigin || [])
      .map(accountName =>
        accounts.find(account => account.name === accountName)
      )
      .filter((account): account is Account => !!account);
  }
);

export const selectUnconnectedAccountsWithActiveOrigin = createSelector(
  selectVaultAccounts,
  selectConnectedAccountsWithActiveOrigin,
  (accounts, connectedAccountsToActiveTab) =>
    accounts.filter(
      account =>
        !connectedAccountsToActiveTab.find(
          connectedAccount => connectedAccount.name === account.name
        )
    )
);

export const selectCountOfAccounts = createSelector(
  selectVaultAccounts,
  accounts => accounts.length
);

export const selectCountOfConnectedAccountsWithActiveOrigin = createSelector(
  selectConnectedAccountsWithActiveOrigin,
  connectedAccounts => connectedAccounts.length
);

export const selectCountOfConnectedSites = createSelector(
  selectAccountNamesByOriginDict,
  accountNamesByOriginDict => Object.keys(accountNamesByOriginDict).length
);

export const selectDeploysJsonById = (state: RootState) => state.vault.jsonById;
