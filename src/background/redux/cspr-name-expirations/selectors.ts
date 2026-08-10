import { RootState } from '@background/redux/store-types';

export const selectCsprNameExpirations = (state: RootState) =>
  state.csprNameExpirations;
