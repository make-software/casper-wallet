import { createAction } from 'typesafe-actions';

import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  Erc20TokenActionResult,
  ExtendedDeploy,
  ExtendedDeployWithId,
  TransferResultWithId
} from '@libs/services/account-activity-service';
import { ContractPackageWithBalance } from '@src/libs/services/erc20-service';
import { NFTTokenResult } from '@libs/services/nft-service';

export const accountBalanceChanged = createAction(
  'ACCOUNT_BALANCE_CHANGED'
)<ActiveAccountBalance>();

export const accountErc20Changed = createAction('ACCOUNT_ERC20_CHANGED')<
  ContractPackageWithBalance[]
>();

export const accountCurrencyRateChanged = createAction(
  'ACCOUNT_CURRENCY_RATE_CHANGED'
)<number | null>();

export const accountCasperActivityChanged = createAction(
  'ACCOUNT_CASPER_ACTIVITY_CHANGED'
)<TransferResultWithId[]>();

export const accountCasperActivityUpdated = createAction(
  'ACCOUNT_CASPER_ACTIVITY_UPDATED'
)<TransferResultWithId[]>();

export const accountErc20TokensActivityChanged = createAction(
  'ACCOUNT_ERC20_TOKEN_ACTIVITY_CHANGED'
)<{
  activityList: Erc20TokenActionResult[];
  contractPackageHash: string;
  tokenActivityCount: number;
}>();

export const accountErc20TokensActivityUpdated = createAction(
  'ACCOUNT_ERC20_TOKEN_ACTIVITY_UPDATED'
)<{
  activityList: Erc20TokenActionResult[];
  contractPackageHash: string;
  tokenActivityCount: number;
}>();

export const accountInfoReset = createAction('ACCOUNT_INFO_RESET')();

export const accountPendingTransactionsChanged = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_CHANGED'
)<ExtendedDeploy>();

export const accountPendingTransactionsRemove = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_REMOVE'
)<string>();

export const accountDeploysAdded = createAction('ACCOUNT_DEPLOYS_ADDED')<
  ExtendedDeployWithId[]
>();

export const accountDeploysUpdated = createAction('ACCOUNT_DEPLOYS_UPDATED')<
  ExtendedDeployWithId[]
>();

export const accountNftTokensAdded = createAction('ACCOUNT_NFT_TOKENS_ADDED')<
  NFTTokenResult[]
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
