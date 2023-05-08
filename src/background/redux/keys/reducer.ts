import { createReducer } from 'typesafe-actions';

import { keysReseted, keysUpdated } from './actions';
import { KeysState } from './types';

type State = KeysState;

const initialState: State = {
  passwordHash: null,
  passwordSaltHash: null,
  keyDerivationSaltHash: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    keysUpdated,
    (state, action): State => ({
      ...state,
      ...action.payload
    })
  )
  .handleAction(keysReseted, () => initialState);
