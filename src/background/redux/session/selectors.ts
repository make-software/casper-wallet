import { RootState } from 'typesafe-actions';

export const selectSessionEncryptionKeyHash = (
  state: RootState
): string | null => state.session.encryptionKeyHash;
