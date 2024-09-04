import { CloudPaginatedResponse, IDeploy } from 'casper-wallet-core';
import { ActionType, createAction } from 'typesafe-actions';

import {
  Erc20TokenActionResult,
  TransferResult
} from '@libs/services/account-activity-service/types';
import { AccountInfo } from '@libs/services/account-info/types';
import {
  AccountData,
  FetchBalanceResponse
} from '@libs/services/balance-service/types';
import {
  GetOnRampResponse,
  OptionsPostRequestData,
  ResponseOnRampProps,
  ResponseSelectionProps,
  SelectionPostRequestData
} from '@libs/services/buy-cspr-service/types';
import { ContractPackageWithBalance } from '@libs/services/erc20-service/types';
import { NFTTokenResult } from '@libs/services/nft-service/types';
import { ErrorResponse, PaginatedResponse } from '@libs/services/types';
import {
  DelegatorResult,
  ValidatorResult
} from '@libs/services/validators-service/types';

type Meta = void;

export const serviceMessage = {
  fetchBalanceRequest: createAction('FETCH_ACCOUNT_BALANCE')<
    { accountHash: string },
    Meta
  >(),
  fetchBalanceResponse: createAction('FETCH_ACCOUNT_BALANCE_RESPONSE')<
    FetchBalanceResponse,
    Meta
  >(),
  fetchAccountBalancesRequest: createAction('FETCH_ACCOUNT_BALANCES')<
    { accountHashes: string },
    Meta
  >(),
  fetchAccountBalancesResponse: createAction('FETCH_ACCOUNT_BALANCES_RESPONSE')<
    PaginatedResponse<AccountData> | ErrorResponse,
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
    PaginatedResponse<TransferResult>,
    Meta
  >(),
  fetchErc20TokenActivityRequest: createAction('FETCH_ERC20_TOKEN_ACTIVITY')<
    { publicKey: string; page: number; contractPackageHash: string },
    Meta
  >(),
  fetchErc20TokenActivityResponse: createAction(
    'FETCH_ERC20_TOKEN_ACTIVITY_RESPONSE'
  )<PaginatedResponse<Erc20TokenActionResult>, Meta>(),
  fetchExtendedDeploysInfoRequest: createAction('FETCH_EXTENDED_DEPLOYS_INFO')<
    { deployHash: string; publicKey: string },
    Meta
  >(),
  fetchExtendedDeploysInfoResponse: createAction(
    'FETCH_EXTENDED_DEPLOYS_INFO_RESPONSE'
  )<IDeploy | null, Meta>(),
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
  )<CloudPaginatedResponse<IDeploy> | ErrorResponse, Meta>(),
  fetchNftTokensRequest: createAction('FETCH_NFT_TOKENS')<
    { accountHash: string; page: number },
    Meta
  >(),
  fetchNftTokensResponse: createAction('FETCH_NFT_TOKENS_RESPONSE')<
    PaginatedResponse<NFTTokenResult> | ErrorResponse,
    Meta
  >(),
  fetchAuctionValidatorsRequest: createAction(
    'FETCH_AUCTION_VALIDATORS'
  )<Meta>(),
  fetchAuctionValidatorsResponse: createAction(
    'FETCH_AUCTION_VALIDATORS_RESPONSE'
  )<PaginatedResponse<ValidatorResult> | ErrorResponse, Meta>(),
  fetchValidatorsDetailsDataRequest: createAction(
    'FETCH_VALIDATORS_DETAILS_DATA'
  )<{ publicKey: string }, Meta>(),
  fetchValidatorsDetailsDataResponse: createAction(
    'FETCH_VALIDATORS_DETAILS_DATA_RESPONSE'
  )<PaginatedResponse<DelegatorResult> | ErrorResponse, Meta>(),
  fetchOnRampGetOptionRequest: createAction(
    'FETCH_ON_RAMP_GET_OPTION_REQUEST'
  )<Meta>(),
  fetchOnRampGetOptionResponse: createAction(
    'FETCH_ON_RAMP_GET_OPTION_RESPONSE'
  )<GetOnRampResponse, Meta>(),
  fetchOnRampPostOptionRequest: createAction(
    'FETCH_ON_RAMP_POST_OPTION_REQUEST'
  )<OptionsPostRequestData, Meta>(),
  fetchOnRampPostOptionResponse: createAction(
    'FETCH_ON_RAMP_POST_OPTION_RESPONSE'
  )<ResponseOnRampProps, Meta>(),
  fetchOnRampPostSelectionRequest: createAction(
    'FETCH_ON_RAMP_POST_SELECTION_REQUEST'
  )<SelectionPostRequestData, Meta>(),
  fetchOnRampPostSelectionResponse: createAction(
    'FETCH_ON_RAMP_POST_SELECTION_RESPONSE'
  )<ResponseSelectionProps, Meta>()
};

export type ServiceMessage = ActionType<typeof serviceMessage>;
