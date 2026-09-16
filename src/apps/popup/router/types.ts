import { IAppMarketingEvent, IDeploy } from 'casper-wallet-core';

import { NFTData } from '@popup/pages/transfer-nft/utils';

import { TokenType } from '@hooks/use-casper-token';

import { ErrorLocationState } from '@libs/layout/error/types';

export interface LocationState extends ErrorLocationState {
  showNavigationMenu?: boolean;
  tokenData?: TokenType | null;
  nftData?: NFTData;
  recipientPublicKey?: string;
  deploy?: IDeploy;
  appEvent?: IAppMarketingEvent;
  /** In `IDexToken.id` terms: `'cspr'` for native CSPR, otherwise the contract package hash. */
  swapFromTokenId?: string;
}
