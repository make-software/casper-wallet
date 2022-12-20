import { createReducer } from 'typesafe-actions';

import { SessionState } from './types';
import {
  sessionReseted,
  encryptionKeyHashCreated,
  vaultUnlocked,
  lastActivityTimeRefreshed,
  activeOriginChanged
} from './actions';
type State = SessionState;

const initialState: State = {
  encryptionKeyHash: null,
  isLocked: true,
  lastActivityTime: null,
  activeOrigin: null
};

export const reducer = createReducer(initialState)
  .handleAction([sessionReseted], (): State => initialState)
  .handleAction(
    vaultUnlocked,
    (state, { payload: { lastActivityTime } }): State => ({
      ...state,
      lastActivityTime,
      isLocked: false
    })
  )
  .handleAction(
    [encryptionKeyHashCreated],
    (state, action): State => ({
      ...state,
      encryptionKeyHash: action.payload.encryptionKeyHash
    })
  )
  .handleAction(
    lastActivityTimeRefreshed,
    (state, { payload: { lastActivityTime } }) => ({
      ...state,
      lastActivityTime
    })
  )
  .handleAction(activeOriginChanged, (state, { payload }) => ({
    ...state,
    activeOrigin: payload
  }));
