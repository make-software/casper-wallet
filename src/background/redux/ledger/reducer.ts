import { createReducer } from 'typesafe-actions';

import {
  ledgerDeployChanged,
  ledgerNewWindowIdChanged,
  ledgerRecipientToSaveOnSuccessChanged,
  ledgerStateCleared,
  ledgerTransactionChanged
} from './actions';
import { LedgerState } from './types';

type State = LedgerState;

const initialState: State = {
  windowId: null,
  deploy: null,
  transaction: null,
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
  .handleAction(ledgerTransactionChanged, (state, { payload }): State => {
    return {
      ...state,
      transaction: payload
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
