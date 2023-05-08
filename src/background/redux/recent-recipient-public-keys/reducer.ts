import { createReducer } from 'typesafe-actions';
import { RecentRecipientPublicKeysState } from '@src/background/redux/recent-recipient-public-keys/types';
import { recipientPublicKeyAdded } from '@src/background/redux/recent-recipient-public-keys/actions';

const initialState = [] as RecentRecipientPublicKeysState;

export const reducer = createReducer(initialState).handleAction(
  recipientPublicKeyAdded,
  (state, action) => {
    return state.includes(action.payload) ? state : [...state, action.payload];
  }
);
