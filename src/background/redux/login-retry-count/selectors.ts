import { RootState } from 'typesafe-actions';

export const selectLoginRetryCount = (state: RootState): number =>
  state.loginRetryCount;
