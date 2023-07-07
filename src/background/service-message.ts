import { ActionType, createAction } from 'typesafe-actions';

import { FetchBalanceResponse } from '@libs/services/balance-service';
import { AccountInfo } from '@libs/services/account-info';
import {
  ExtendedDeployResult,
  LedgerLiveDeploysResult,
  Erc20TokenActionResult
} from 'src/libs/services/account-activity-service';
import { PaginatedResponse } from '@libs/services/types';
import { ContractPackageWithBalance } from '@libs/services/erc20-service';

type Meta = void;

export const serviceMessage = {
  fetchBalanceRequest: createAction('FETCH_ACCOUNT_BALANCE')<
    { publicKey: string },
    Meta
  >(),
  fetchBalanceResponse: createAction('FETCH_ACCOUNT_BALANCE_RESPONSE')<
    FetchBalanceResponse,
    Meta
  >(),
  fetchAccountInfoRequest: createAction('FETCH_ACCOUNT_INFO')<
    { accountHash: string },
    Meta
  >(),
  fetchAccountInfoResponse: createAction('FETCH_ACCOUNT_INFO_RESPONSE')<
    AccountInfo,
    Meta
  >(),
  fetchAccountActivityRequest: createAction('FETCH_ACCOUNT_ACTIVITY')<
    { publicKey: string; page: number },
    Meta
  >(),
  fetchAccountActivityResponse: createAction('FETCH_ACCOUNT_ACTIVITY_RESPONSE')<
    PaginatedResponse<LedgerLiveDeploysResult>,
    Meta
  >(),
  fetchErc20AccountActivityRequest: createAction(
    'FETCH_ERC20_ACCOUNT_ACTIVITY'
  )<{ publicKey: string; page: number }, Meta>(),
  fetchErc20AccountActivityResponse: createAction(
    'FETCH_ERC20_ACCOUNT_ACTIVITY_RESPONSE'
  )<PaginatedResponse<Erc20TokenActionResult>, Meta>(),
  fetchErc20TokenActivityRequest: createAction('FETCH_ERC20_TOKEN_ACTIVITY')<
    { publicKey: string; page: number; contractPackageHash: string },
    Meta
  >(),
  fetchErc20TokenActivityResponse: createAction(
    'FETCH_ERC20_TOKEN_ACTIVITY_RESPONSE'
  )<PaginatedResponse<Erc20TokenActionResult>, Meta>(),
  fetchExtendedDeploysInfoRequest: createAction('FETCH_EXTENDED_DEPLOYS_INFO')<
    { deployHash: string },
    Meta
  >(),
  fetchExtendedDeploysInfoResponse: createAction(
    'FETCH_EXTENDED_DEPLOYS_INFO_RESPONSE'
  )<ExtendedDeployResult, Meta>(),
  fetchErc20TokensRequest: createAction('FETCH_ERC20_TOKENS')<
    { accountHash: string },
    Meta
  >(),
  fetchErc20TokensResponse: createAction('FETCH_ERC20_TOKENS_RESPONSE')<
    ContractPackageWithBalance[],
    Meta
  >(),
  fetchAccountExtendedDeploysRequest: createAction('FETCH_ACCOUNT_DEPLOYS')<
    { publicKey: string; page: number },
    Meta
  >(),
  fetchAccountExtendedDeploysResponse: createAction(
    'FETCH_ACCOUNT_DEPLOYS_RESPONSE'
  )<PaginatedResponse<ExtendedDeployResult>, Meta>()
};

export type ServiceMessage = ActionType<typeof serviceMessage>;
