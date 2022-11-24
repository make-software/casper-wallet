import { createReducer } from 'typesafe-actions';

import { deployPayloadReceived, deploysReseted } from './actions';
import { DeploysState } from './types';

type State = DeploysState;

const initialState: State = {
  jsonById: {}
};

export const reducer = createReducer(initialState)
  .handleAction([deploysReseted], (): State => initialState)
  .handleAction(
    [deployPayloadReceived],
    (state, { payload }): State => ({
      ...state,
      jsonById: { [payload.id]: payload.json }
    })
  );
