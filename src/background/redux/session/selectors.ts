import { RootState } from 'typesafe-actions';

export const selectEncryptionKeyHash = (state: RootState): string | null =>
  state.session.encryptionKeyHash;

export const selectEncryptionKeyDoesExist = (state: RootState): boolean =>
  state.session.encryptionKeyDoesExist;

export const selectVaultIsLocked = (state: RootState): boolean =>
  state.session.isLocked;

export const selectIsContactEditingAllowed = (state: RootState) =>
  state.session.isContactEditingAllowed;
