import { createSelector } from 'reselect';

import { RootState } from '@background/redux/store-types';

import { LoginRetryLockoutTimeState } from './types';

export const selectLoginRetryLockoutTime = (
  state: RootState
): LoginRetryLockoutTimeState => state.loginRetryLockoutTime;

export const selectHasLoginRetryLockoutTime = createSelector(
  selectLoginRetryLockoutTime,
  loginRetryLockoutTime => loginRetryLockoutTime != null
);
