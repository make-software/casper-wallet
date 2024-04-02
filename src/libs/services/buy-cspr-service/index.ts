import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { queryClient } from '@libs/services/query-client';
import { ErrorResponse, Payload } from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';

import { onRampOptionsUrl, onRampSelectionUrl } from './constants';
import {
  GetOnRampResponse,
  OptionsPostRequestData,
  ResponseOnRampProps,
  ResponseSelectionProps,
  SelectionPostRequestData
} from './types';

export const onRampGetOptionRequest = (
  signal?: AbortSignal
): Promise<GetOnRampResponse> =>
  fetch(onRampOptionsUrl, { signal }).then(toJson).catch(handleError);

export const onRampPostOptionRequest = (
  data: OptionsPostRequestData,
  signal?: AbortSignal
): Promise<ResponseOnRampProps> =>
  fetch(onRampOptionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal,
    body: JSON.stringify(data)
  })
    .then(toJson)
    .catch(handleError);

export const onRampPostSelectionRequest = (
  data: SelectionPostRequestData,
  signal?: AbortSignal
): Promise<ResponseSelectionProps> =>
  fetch(onRampSelectionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    signal,
    body: JSON.stringify(data)
  })
    .then(toJson)
    .catch(handleError);

export const fetchOnRampOptionGet = () =>
  queryClient.fetchQuery(['onRampGetOptionRequest'], ({ signal }) =>
    onRampGetOptionRequest(signal)
  );

export const fetchOnRampOptionPost = (data: OptionsPostRequestData) =>
  queryClient.fetchQuery(['onRampPostOptionRequest', data], ({ signal }) =>
    onRampPostOptionRequest(data, signal)
  );

export const fetchOnRampSelectionPost = (data: SelectionPostRequestData) =>
  queryClient.fetchQuery(['onRampPostSelectionRequest', data], ({ signal }) =>
    onRampPostSelectionRequest(data, signal)
  );

export const dispatchFetchOnRampOptionGet = (): Promise<
  Payload<GetOnRampResponse | ErrorResponse>
> => dispatchToMainStore(serviceMessage.fetchOnRampGetOptionRequest());

export const dispatchFetchOnRampOptionPost = (
  data: OptionsPostRequestData
): Promise<Payload<ResponseOnRampProps | ErrorResponse>> =>
  dispatchToMainStore(serviceMessage.fetchOnRampPostOptionRequest(data));

export const dispatchFetchOnRampSelectionPost = (
  data: SelectionPostRequestData
): Promise<Payload<ResponseSelectionProps | ErrorResponse>> =>
  dispatchToMainStore(serviceMessage.fetchOnRampPostSelectionRequest(data));
