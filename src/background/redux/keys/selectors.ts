import { RootState } from '@background/redux/store-types';

export const selectKeysDoesExist = (state: RootState): boolean =>
  state.keys.keysDoesExist;
