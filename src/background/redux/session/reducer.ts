import { createReducer } from 'typesafe-actions';

import { SessionState } from './types';
import { sessionDestroyed, encryptionKeyHashCreated } from './actions';
type State = SessionState;

const initialState: State = {
  encryptionKeyHash: null
};

export const reducer = createReducer(initialState)
  .handleAction([sessionDestroyed], (): State => initialState)
  .handleAction(
    [encryptionKeyHashCreated],
    (state, action): State => ({
      ...state,
      encryptionKeyHash: action.payload.encryptionKeyHash
    })
  );
