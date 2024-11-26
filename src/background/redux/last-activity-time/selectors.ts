import { RootState } from 'typesafe-actions';

export const selectVaultLastActivityTime = (state: RootState): number | null =>
  state.lastActivityTime;
