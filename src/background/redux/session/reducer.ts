import { createReducer } from 'typesafe-actions';

import { SessionState } from './types';
import {
  sessionReseted,
  encryptionKeyHashCreated,
  vaultUnlocked,
  contactEditingPermissionChanged
} from './actions';

type State = SessionState;

const initialState: State = {
  encryptionKeyHash: null,
  isLocked: true,
  isContactEditingAllowed: false
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
  .handleAction(
    contactEditingPermissionChanged,
    (state): State => ({
      ...state,
      isContactEditingAllowed: true
    })
  );
