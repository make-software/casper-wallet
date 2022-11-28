import { RootState } from 'typesafe-actions';

export const selectVaultCipher = (state: RootState): string | null =>
  state.vaultCipher;
