import { RootState } from 'typesafe-actions';

export const selectEncryptionKeyHash = (state: RootState): string | null =>
  state.session.encryptionKeyHash;

export const selectVaultIsLocked = (state: RootState): boolean =>
  state.session.isLocked;
