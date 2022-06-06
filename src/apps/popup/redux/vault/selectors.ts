import { createSelector } from 'reselect';
import { State } from '@popup/redux/types';
import { TimeoutDurationSetting } from '@popup/constants';
import { Account } from '@popup/redux/vault/types';

export const selectVaultDoesExist = (state: State): boolean =>
  !!state.vault.password;

export const selectVaultHasAccount = (state: State): boolean =>
  state.vault.accounts.length > 0;

export const selectVaultAccounts = (state: State): Account[] =>
  state.vault.accounts;

export const selectVaultAccountsNames = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.name)
);

export const selectVaultAccountsSecretKeysBase64 = createSelector(
  selectVaultAccounts,
  accounts => accounts.map(account => account.secretKey)
);

export const selectVaultIsLocked = (state: State): boolean =>
  state.vault.isLocked;

export const selectVaultPassword = (state: State): string =>
  state.vault.password || '';

export const selectVaultTimeoutDurationSetting = (
  state: State
): TimeoutDurationSetting => state.vault.timeoutDurationSetting;

export const selectVaultLastActivityTime = (state: State): number | null =>
  state.vault.lastActivityTime;
