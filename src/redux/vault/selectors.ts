import { State } from '@src/redux/types';

export const selectIsVaultCreated = (state: State): boolean =>
  !!state.vault.password;

export const selectIsAccountCreated = (state: State): boolean =>
  state.vault.accounts.length > 0;

export const selectIsVaultLocked = (state: State): boolean =>
  state.vault.isLocked;

export const selectVaultPassword = (state: State): string =>
  state.vault.password || '';
