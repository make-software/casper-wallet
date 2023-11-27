import { ActivityType } from '@src/constants';
import { TokenType } from '@src/hooks';
import { ErrorLocationState } from '@layout/error';

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
}
