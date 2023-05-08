import { RootState } from 'typesafe-actions';

export const selectVaultCipherDoesExist = (state: RootState): boolean =>
  state.vaultCipher != null;

export const selectVaultCipher = (state: RootState): string | null =>
  state.vaultCipher;
