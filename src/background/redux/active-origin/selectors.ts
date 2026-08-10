import { RootState } from '@background/redux/store-types';

export const selectActiveOrigin = (state: RootState): string | null =>
  state.activeOrigin;
