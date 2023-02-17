import { createReducer } from 'typesafe-actions';

import {
  loginRetryLockoutTimeReseted,
  loginRetryLockoutTimeSet
} from './actions';
import { LoginRetryLockoutTimeState } from './types';

const initialState = null as LoginRetryLockoutTimeState;

export const reducer = createReducer(initialState)
  .handleAction(loginRetryLockoutTimeReseted, () => initialState)
  .handleAction(loginRetryLockoutTimeSet, (state, action) => action.payload);
