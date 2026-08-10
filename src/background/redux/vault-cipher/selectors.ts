import { RootState } from '@background/redux/store-types';

export const selectVaultCipherDoesExist = (state: RootState): boolean =>
  state.vaultCipher != null;
