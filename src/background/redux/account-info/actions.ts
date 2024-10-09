import { createAction } from 'typesafe-actions';

import { NFTTokenResult } from '@libs/services/nft-service/types';

export const accountInfoReset = createAction('ACCOUNT_INFO_RESET')();

export const accountPendingDeployHashesChanged = createAction(
  'ACCOUNT_PENDING_DEPLOY_HASHES_CHANGED'
)<string>();

export const accountPendingDeployHashesRemove = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_REMOVE'
)<string>();

export const accountNftTokensAdded = createAction('ACCOUNT_NFT_TOKENS_ADDED')<
  NFTTokenResult[] | null
>();

export const accountNftTokensUpdated = createAction(
  'ACCOUNT_NFT_TOKENS_UPDATED'
)<NFTTokenResult[]>();

export const accountNftTokensCountChanged = createAction(
  'ACCOUNT_NFT_TOKENS_COUNT_CHANGED'
)<number>();

export const accountTrackingIdOfSentNftTokensChanged = createAction(
  'ACCOUNT_TRACKING_ID_OF_SENT_NFT_TOKENS_CHANGED'
)<{
  trackingId: string;
  deployHash: string;
}>();

export const accountTrackingIdOfSentNftTokensRemoved = createAction(
  'ACCOUNT_TRACKING_ID_OF_SENT_NFT_TOKENS_REMOVED'
)<string>();
