import { createReducer } from 'typesafe-actions';

import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from './actions';
import { LoginRetryLockoutTime } from './types';

const initialState = null as LoginRetryLockoutTime;

export const reducer = createReducer(initialState)
  .handleAction(loginRetryLockoutTimeReseted, () => initialState)
  .handleAction(loginRetryLockoutTimeSet, (state, action) => action.payload);
