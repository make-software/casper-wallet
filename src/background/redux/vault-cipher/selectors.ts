import { RootState } from 'typesafe-actions';

export const selectVaultDoesExist = (state: RootState): boolean =>
  state.vaultCipher != null;

export const selectVaultCipher = (state: RootState): string | null =>
  state.vaultCipher;
