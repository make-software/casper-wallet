import { createReducer } from 'typesafe-actions';

import { loginRetryCountIncremented, loginRetryCountReseted } from './actions';

export type LoginRetryCountState = number;

const initialState = 0 as LoginRetryCountState;

export const reducer = createReducer(initialState)
  .handleAction(
    loginRetryCountReseted,
    (): LoginRetryCountState => initialState
  )
  .handleAction(
    loginRetryCountIncremented,
    (state): LoginRetryCountState => state + 1
  );
