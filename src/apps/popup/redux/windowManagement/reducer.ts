import { createReducer } from 'typesafe-actions';

import { WindowManagementState } from './types';
import { clearWindowId, saveWindowId } from './actions';
type State = WindowManagementState;

const initialState: State = {
  windowId: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    [saveWindowId],
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
