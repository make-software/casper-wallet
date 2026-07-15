import { RootState } from 'typesafe-actions';

export const selectCsprNameExpirations = (state: RootState) =>
  state.csprNameExpirations;
