import { createAction } from 'typesafe-actions';

export const loginRetryCountReseted = createAction(
  'LOGIN_RETRY_COUNT_RESETED'
)<void>();

export const loginRetryCountIncremented = createAction(
  'LOGIN_RETRY_COUNT_INCREMENTED'
)<void>();
