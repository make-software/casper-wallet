import { ActivityType } from '@src/constants';
import { TokenType } from '@src/hooks';

export type LocationState = {
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
};
