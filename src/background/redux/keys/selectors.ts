import { RootState } from 'typesafe-actions';

export const selectKeysDoesExist = (state: RootState): boolean =>
  state.keys.keysDoesExist;

export const selectPasswordHash = (state: RootState): string | null =>
  state.keys.passwordHash;

export const selectPasswordSaltHash = (state: RootState): string | null =>
  state.keys.passwordSaltHash;

export const selectKeyDerivationSaltHash = (state: RootState): string | null =>
  state.keys.keyDerivationSaltHash;
