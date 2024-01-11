import { createReducer } from 'typesafe-actions';

import { recipientPublicKeyAdded, recipientPublicKeyReseted } from './actions';
import { RecentRecipientPublicKeysState } from './types';

const initialState = [] as RecentRecipientPublicKeysState;

export const reducer = createReducer(initialState)
  .handleAction(recipientPublicKeyReseted, () => initialState)
  .handleAction(
    recipientPublicKeyAdded,
    // This is a hack to make sure the most recent recipient is always at the top of the list.
    (state, action) => [...new Set([action.payload, ...state])]
  );
