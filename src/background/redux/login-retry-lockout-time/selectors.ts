import { RootState } from 'typesafe-actions';

import { LoginRetryLockoutTime } from './types';

export const selectLoginRetryLockoutTime = (
  state: RootState
): LoginRetryLockoutTime => state.loginRetryLockoutTime;
