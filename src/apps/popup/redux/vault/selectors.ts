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
