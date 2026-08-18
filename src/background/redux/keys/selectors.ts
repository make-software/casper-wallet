import { RootState } from '@background/redux/store-types';

export const selectKeysDoesExist = (state: RootState): boolean =>
  state.keys.keysDoesExist;

export const selectPasswordHash = (state: RootState): string | null =>
  state.keys.passwordHash;

export const selectPasswordSaltHash = (state: RootState): string | null =>
  state.keys.passwordSaltHash;
