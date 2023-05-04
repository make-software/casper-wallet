import { createReducer } from 'typesafe-actions';
import { RecipientPublicKeysState } from '@background/redux/recipient-public-keys/types';
import { recipientPublicKeyAdded } from '@background/redux/recipient-public-keys/actions';

const initialState = [] as RecipientPublicKeysState;

export const reducer = createReducer(initialState).handleAction(
  recipientPublicKeyAdded,
  (state, action) => {
    return state.includes(action.payload) ? state : [...state, action.payload];
  }
);
