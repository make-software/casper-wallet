import { State } from '@src/redux/types';
import { Timeout } from '@src/app/types';

export const selectIsVaultCreated = (state: State): boolean =>
  !!state.vault.password;

export const selectIsAccountCreated = (state: State): boolean =>
  state.vault.accounts.length > 0;

export const selectIsVaultLocked = (state: State): boolean =>
  state.vault.isLocked;

export const selectVaultPassword = (state: State): string =>
  state.vault.password || '';

export const selectTimeout = (state: State): Timeout => state.vault.timeout;

export const selectTimeoutStartFrom = (state: State): number | null =>
  state.vault.timeoutStartFrom;
