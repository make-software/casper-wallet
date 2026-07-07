import { RootState } from '@background/redux/store-types';

export const selectVaultCipherDoesExist = (state: RootState): boolean =>
  state.vaultCipher != null;

export const selectVaultCipher = (state: RootState): string | null =>
  state.vaultCipher;
