import { RootState } from 'typesafe-actions';

export const selectEncryptionKeyHash = (state: RootState): string | null =>
  state.session.encryptionKeyHash;

export const selectActiveOrigin = (state: RootState): string | null =>
  state.session.activeOrigin;

export const selectVaultIsLocked = (state: RootState): boolean =>
  state.session.isLocked;

export const selectVaultLastActivityTime = (state: RootState): number | null =>
  state.session.lastActivityTime;
