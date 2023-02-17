import { createAction } from 'typesafe-actions';

export const loginRetryLockoutTimeReseted = createAction(
  'LOGIN_RETRY_LOCKOUT_TIME_RESETED'
)<void>();

export const loginRetryLockoutTimeSet = createAction(
  'LOGIN_RETRY_LOCKOUT_TIME_SET',
  (payload: number) => payload
)<number>();
