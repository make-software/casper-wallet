import { RootState } from '@background/redux/store-types';

export const selectVaultLastActivityTime = (state: RootState): number | null =>
  state.lastActivityTime;
