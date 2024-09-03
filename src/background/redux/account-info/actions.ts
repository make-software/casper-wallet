import { createAction } from 'typesafe-actions';

import {
  AccountDeploysDataType,
  Cep18TransferDeploysDataType,
  CsprTransferDeploysDataType
} from '@background/redux/account-info/types';

import { AccountBalance } from '@libs/services/balance-service/types';
import { ContractPackageWithBalance } from '@libs/services/erc20-service/types';
import { NFTTokenResult } from '@libs/services/nft-service/types';

export const accountBalanceChanged = createAction(
  'ACCOUNT_BALANCE_CHANGED'
)<AccountBalance>();

export const accountErc20Changed = createAction('ACCOUNT_ERC20_CHANGED')<
  ContractPackageWithBalance[]
>();

export const accountCurrencyRateChanged = createAction(
  'ACCOUNT_CURRENCY_RATE_CHANGED'
)<number | null>();

export const accountCsprTransferDeploysDataChanged = createAction(
  'ACCOUNT_CSPR_TRANSFER_DEPLOYS_DATA_CHANGED'
)<CsprTransferDeploysDataType>();

export const accountCep18TransferDeploysDataChanged = createAction(
  'ACCOUNT_CEP18_TRANSFER_DEPLOYS_DATA_CHANGED'
)<{
  cep18TransferDeploysData: Cep18TransferDeploysDataType;
  contractPackageHash: string;
}>();

export const accountInfoReset = createAction('ACCOUNT_INFO_RESET')();

export const accountPendingDeployHashesChanged = createAction(
  'ACCOUNT_PENDING_DEPLOY_HASHES_CHANGED'
)<string>();

export const accountPendingDeployHashesRemove = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_REMOVE'
)<string>();

export const accountDeploysDataChanged = createAction(
  'ACCOUNT_DEPLOYS_DATA_CHANGED'
)<AccountDeploysDataType>();

export const accountNftTokensAdded = createAction('ACCOUNT_NFT_TOKENS_ADDED')<
  NFTTokenResult[] | null
>();

export const accountNftTokensUpdated = createAction(
  'ACCOUNT_NFT_TOKENS_UPDATED'
)<NFTTokenResult[]>();

export const accountNftTokensCountChanged = createAction(
  'ACCOUNT_NFT_TOKENS_COUNT_CHANGED'
)<number>();

export const accountDeploysCountChanged = createAction(
  'ACCOUNT_DEPLOYS_COUNT_CHANGED'
)<number>();

export const accountCasperActivityCountChanged = createAction(
  'ACCOUNT_CASPER_ACTIVITY_COUNT_CHANGED'
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
