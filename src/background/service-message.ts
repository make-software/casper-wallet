import { IDeploy } from 'casper-wallet-core';
import { ActionType, createAction } from 'typesafe-actions';

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
