import { RootState } from '@background/redux/store-types';

export const selectActiveOriginFavicon = (state: RootState): string | null =>
  state.activeOriginFavicon;
