import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import { LoginRetryLockoutTimeState } from './types';

export const selectLoginRetryLockoutTime = (
  state: RootState
): LoginRetryLockoutTimeState => state.loginRetryLockoutTime;

export const selectHasLoginRetryLockoutTime = createSelector(
  selectLoginRetryLockoutTime,
  loginRetryLockoutTime => loginRetryLockoutTime != null
);
