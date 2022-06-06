import { createReducer } from 'typesafe-actions';

import { WindowManagementState } from './types';
import { clearWindowId, storeWindowId } from './actions';
type State = WindowManagementState;

const initialState: State = {
  windowId: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    [storeWindowId],
    (state, { payload }): State => ({
      ...state,
      windowId: payload
    })
  )
  .handleAction(
    clearWindowId,
    (state): State => ({
      ...state,
      windowId: null
    })
  );
