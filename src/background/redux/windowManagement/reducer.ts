import { createReducer } from 'typesafe-actions';

import { WindowManagementState } from './types';
import { windowIdCleared, windowIdChanged } from './actions';
type State = WindowManagementState;

const initialState: State = {
  windowId: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    windowIdChanged,
    (state, { payload }): State => ({
      ...state,
      windowId: payload
    })
  )
  .handleAction(
    windowIdCleared,
    (state): State => ({
      ...state,
      windowId: null
    })
  );
