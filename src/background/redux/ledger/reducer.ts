import { createReducer } from 'typesafe-actions';

import {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared
} from './actions';
import { LedgerState } from './types';

type State = LedgerState;

const initialState: State = {
  windowId: null,
  deploy: null,
  recipientToSaveOnSuccess: null
};

export const reducer = createReducer(initialState)
  .handleAction(
    ledgerNewWindowIdChanged,
    (state, { payload }): State => ({
      ...state,
      windowId: payload
    })
  )
  .handleAction(ledgerStateCleared, (): State => initialState)
  .handleAction(ledgerDeployChanged, (state, { payload }): State => {
    return {
      ...state,
      deploy: payload
    };
  })
  .handleAction(
    ledgerRecipientToSaveOnSuccessChanged,
    (state, { payload }): State => {
      return {
        ...state,
        recipientToSaveOnSuccess: payload
      };
    }
  );
