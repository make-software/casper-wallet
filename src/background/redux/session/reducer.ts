import { createReducer } from 'typesafe-actions';

import { SessionState } from './types';
import {
  sessionReseted,
  encryptionKeyHashCreated,
  vaultUnlocked,
  activeOriginChanged
} from './actions';
type State = SessionState;

const initialState: State = {
  encryptionKeyHash: null,
  isLocked: true,
  activeOrigin: null
};

export const reducer = createReducer(initialState)
  .handleAction(sessionReseted, (): State => initialState)
  .handleAction(
    vaultUnlocked,
    (state, { payload: { lastActivityTime } }): State => ({
      ...state,
      isLocked: false
    })
  )
  .handleAction(
    encryptionKeyHashCreated,
    (state, action): State => ({
      ...state,
      encryptionKeyHash: action.payload.encryptionKeyHash
    })
  )

  .handleAction(activeOriginChanged, (state, { payload }) => ({
    ...state,
    activeOrigin: payload
  }));
