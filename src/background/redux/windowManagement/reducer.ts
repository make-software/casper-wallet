import { createReducer } from 'typesafe-actions';

import { WindowManagementState } from './types';
import { windowIdCleared, windowIdChanged } from './actions';
import { E2ESetToPopupState } from '../e2e/actions';

type State = WindowManagementState;

const initialState: State = {
  windowId: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    [windowIdChanged],
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
  )
  .handleAction(
    [E2ESetToPopupState],
    (state, { payload: { windowManagement } }) => ({
      ...state,
      ...windowManagement
    })
  );
