import { ActionType, createAction } from 'typesafe-actions';

import {
  GetOnRampResponse,
  OptionsPostRequestData,
  ResponseOnRampProps,
  ResponseSelectionProps,
  SelectionPostRequestData
} from '@libs/services/buy-cspr-service/types';
import { ErrorResponse, PaginatedResponse } from '@libs/services/types';
import {
  DelegatorResult,
  ValidatorResult
} from '@libs/services/validators-service/types';

type Meta = void;

export const serviceMessage = {
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
