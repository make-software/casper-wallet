import { createReducer } from 'typesafe-actions';

import { SessionState } from './types';
import { secretPhraseDecrypted, sessionDestroyed } from './actions';
type State = SessionState;

const initialState: State = {
  secretPhrase: null
};

export const reducer = createReducer(initialState)
  .handleAction([sessionDestroyed], (state, action): State => initialState)
  .handleAction(
    [secretPhraseDecrypted],
    (state, action): State => ({
      ...state,
      secretPhrase: action.payload
    })
  );
