import { RootState } from 'typesafe-actions';

import { RecentRecipientPublicKeysState } from '@src/background/redux/recent-recipient-public-keys/types';

export const selectRecentRecipientPublicKeys = (
  state: RootState
): RecentRecipientPublicKeysState => state.recentRecipientPublicKeys;
