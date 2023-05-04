import { RootState } from 'typesafe-actions';

import { RecipientPublicKeysState } from '@background/redux/recipient-public-keys/types';

export const selectRecipientPublicKeys = (
  state: RootState
): RecipientPublicKeysState => state.recipientPublicKeys;
