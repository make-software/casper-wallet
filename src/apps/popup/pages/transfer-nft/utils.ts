import { Maybe } from 'casper-wallet-core/src/typings/common';

import {
  NFT_CEP47_PAYMENT_AMOUNT_AVERAGE_MOTES,
  NFT_CEP78_PAYMENT_AMOUNT_AVERAGE_MOTES
} from '@src/constants';
import { NFTTokenStandard } from '@src/utils';

import { motesToCSPR } from '@libs/ui/utils';

export const getDefaultPaymentAmountBasedOnNftTokenStandard = (
  tokenStandard?: string
) => {
  switch (tokenStandard) {
    case NFTTokenStandard.CEP47:
      return motesToCSPR(NFT_CEP47_PAYMENT_AMOUNT_AVERAGE_MOTES);
    case NFTTokenStandard.CEP78:
      return motesToCSPR(NFT_CEP78_PAYMENT_AMOUNT_AVERAGE_MOTES);
    default:
      return '0';
  }
};

export enum TransferNFTSteps {
  Review = 'review',
  Recipient = 'recipient',
  Confirm = 'confirm',
  ConfirmWithLedger = 'confirm with ledger',
  Success = 'success'
}

export interface NFTData {
  contentType?: string;
  url?: Maybe<string>;
}
