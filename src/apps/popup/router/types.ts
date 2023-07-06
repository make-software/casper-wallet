import { TransferType } from '@libs/ui';
import { TokenType } from '@src/hooks';

export type LocationState = {
  showNavigationMenu?: boolean;
  activityDetailsData?: {
    fromAccountPublicKey: string;
    toAccountPublicKey: string;
    deployHash: string;
    type: TransferType | null;
  };
  activeTabId?: number;
  tokenData?: TokenType | null;
};
