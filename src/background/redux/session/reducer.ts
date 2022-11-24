import { createReducer } from 'typesafe-actions';

import { SessionState } from './types';
import { sessionReseted, encryptionKeyHashCreated } from './actions';
type State = SessionState;

const initialState: State = {
  encryptionKeyHash: null
};

export const reducer = createReducer(initialState)
  .handleAction([sessionReseted], (): State => initialState)
  .handleAction(
    [encryptionKeyHashCreated],
    (state, action): State => ({
      ...state,
      encryptionKeyHash: action.payload.encryptionKeyHash
    })
  );
