import { RecentRecipientPublicKeysState } from '@background/redux/recent-recipient-public-keys/types';
import { RootState } from '@background/redux/store-types';

export const selectRecentRecipientPublicKeys = (
  state: RootState
): RecentRecipientPublicKeysState => state.recentRecipientPublicKeys;
