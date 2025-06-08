import { RootState } from 'typesafe-actions';

export const selectActiveOriginFavicon = (state: RootState): string | null =>
  state.activeOriginFavicon;
