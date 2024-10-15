import { ActionType, createAction } from 'typesafe-actions';

import {
  GetOnRampResponse,
  OptionsPostRequestData,
  ResponseOnRampProps,
  ResponseSelectionProps,
  SelectionPostRequestData
} from '@libs/services/buy-cspr-service/types';

type Meta = void;

export const serviceMessage = {
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
