import { createReducer } from 'typesafe-actions';

import { accountBalancesChanged, accountBalancesReseted } from './actions';
import { AccountBalancesState } from './types';

const initialState = [] as AccountBalancesState;

export const reducer = createReducer(initialState)
  .handleAction(accountBalancesReseted, () => initialState)
  .handleAction(
    accountBalancesChanged,
    (state, action: ReturnType<typeof accountBalancesChanged>) => action.payload
  );
