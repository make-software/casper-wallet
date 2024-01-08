import { ActivityType } from '@src/constants';

import { TokenType } from '@hooks/use-casper-token';

import { ErrorLocationState } from '@libs/layout';

export interface LocationState extends ErrorLocationState {
  showNavigationMenu?: boolean;
  activityDetailsData?: {
    fromAccount: string;
    toAccount: string;
    deployHash: string;
    type: ActivityType | null;
    amount?: string;
    symbol?: string;
    isDeploysList?: boolean;
  };
  activeTabId?: number;
  tokenData?: TokenType | null;
  nftData?: {
    contentType: string;
    url?: string;
  };
  recipientPublicKey?: string;
}
