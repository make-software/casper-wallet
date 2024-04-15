import { RootState } from 'typesafe-actions';

export const selectAccountBalances = (state: RootState) =>
  state.accountBalances;
