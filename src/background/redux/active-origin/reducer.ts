import { createReducer } from 'typesafe-actions';

import { activeOriginChanged } from './actions';
import { ActiveOriginState } from './types';

const initialState = null as ActiveOriginState;

export const reducer = createReducer(initialState).handleAction(
  activeOriginChanged,
  (state, { payload }) => payload
);
