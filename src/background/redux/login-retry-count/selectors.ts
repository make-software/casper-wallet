import { RootState } from '@background/redux/store-types';

export const selectLoginRetryCount = (state: RootState): number =>
  state.loginRetryCount;
