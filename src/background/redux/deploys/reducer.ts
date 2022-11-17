import { createReducer } from 'typesafe-actions';

import { deployPayloadReceived } from './actions';
import { E2ESetToPopupState } from '../e2e/actions';

import { DeploysState } from './types';

type State = DeploysState;

const initialState: State = {
  jsonById: {}
};

export const reducer = createReducer(initialState)
  .handleAction(
    [deployPayloadReceived],
    (state, { payload }): State => ({
      ...state,
      jsonById: { [payload.id]: payload.json }
    })
  )
  .handleAction([E2ESetToPopupState], (state, { payload: { deploys } }) => ({
    ...state,
    ...deploys
  }));
