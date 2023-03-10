import { RootState } from 'typesafe-actions';

export const selectActiveOrigin = (state: RootState): string | null =>
  state.activeOrigin;
