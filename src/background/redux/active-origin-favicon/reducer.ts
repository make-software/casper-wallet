import { createReducer } from 'typesafe-actions';

import { activeOriginFaviconChanged } from './actions';
import { ActiveOriginFaviconState } from './types';

const initialState: ActiveOriginFaviconState = null;

export const reducer = createReducer<ActiveOriginFaviconState>(
  initialState
).handleAction(activeOriginFaviconChanged, (state, { payload }) => payload);
