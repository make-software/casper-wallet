import { IDeploy } from 'casper-wallet-core';

import { TokenType } from '@hooks/use-casper-token';

import { ErrorLocationState } from '@libs/layout/error/types';

export interface LocationState extends ErrorLocationState {
  showNavigationMenu?: boolean;
  activeTabId?: number;
  tokenData?: TokenType | null;
  nftData?: {
    contentType: string;
    url?: string;
  };
  recipientPublicKey?: string;
  deploy?: IDeploy;
  navigateHome?: boolean;
}
