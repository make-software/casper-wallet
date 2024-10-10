import { createAction } from 'typesafe-actions';

export const accountInfoReset = createAction('ACCOUNT_INFO_RESET')();

export const accountPendingDeployHashesChanged = createAction(
  'ACCOUNT_PENDING_DEPLOY_HASHES_CHANGED'
)<string>();

export const accountPendingDeployHashesRemove = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_REMOVE'
)<string>();

export const accountTrackingIdOfSentNftTokensChanged = createAction(
  'ACCOUNT_TRACKING_ID_OF_SENT_NFT_TOKENS_CHANGED'
)<{
  trackingId: string;
  deployHash: string;
}>();

export const accountTrackingIdOfSentNftTokensRemoved = createAction(
  'ACCOUNT_TRACKING_ID_OF_SENT_NFT_TOKENS_REMOVED'
)<string>();
