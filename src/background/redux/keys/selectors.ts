import { RootState } from 'typesafe-actions';

export const selectPasswordHash = (state: RootState): string =>
  state.keys.passwordHash || '';

export const selectPasswordSaltHash = (state: RootState): string =>
  state.keys.passwordSaltHash || '';

export const selectKeyDerivationSaltHash = (state: RootState): string =>
  state.keys.keyDerivationSaltHash || '';
