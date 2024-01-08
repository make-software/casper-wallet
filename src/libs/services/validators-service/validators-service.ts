import { VALIDATORS_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { queryClient } from '@libs/services/query-client';
import {
  ErrorResponse,
  PaginatedResponse,
  Payload
} from '@libs/services/types';
import { handleError, toJson } from '@libs/services/utils';
import {
  getAuctionValidatorsUrl,
  getValidatorsDetailsDataUrl
} from '@libs/services/validators-service/constants';
import {
  DelegatorResult,
  ValidatorResult
} from '@libs/services/validators-service/types';

export const auctionValidatorsRequest = (
  casperApiUrl: string,
  signal?: AbortSignal
) =>
  fetch(getAuctionValidatorsUrl(casperApiUrl), { signal })
    .then(toJson)
    .catch(handleError);

export const validatorsDetailsDataRequest = (
  casperApiUrl: string,
  publicKey: string,
  signal?: AbortSignal
) =>
  fetch(getValidatorsDetailsDataUrl(casperApiUrl, publicKey), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchAuctionValidators = ({
  casperApiUrl
}: {
  casperApiUrl: string;
}): Promise<PaginatedResponse<ValidatorResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['getAuctionValidators', casperApiUrl],
    ({ signal }) => auctionValidatorsRequest(casperApiUrl, signal),
    {
      staleTime: VALIDATORS_REFRESH_RATE
    }
  );

export const fetchValidatorsDetailsData = ({
  casperApiUrl,
  publicKey
}: {
  casperApiUrl: string;
  publicKey: string;
}): Promise<PaginatedResponse<DelegatorResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['getDelegations', casperApiUrl, publicKey],
    ({ signal }) =>
      validatorsDetailsDataRequest(casperApiUrl, publicKey, signal),
    {
      staleTime: VALIDATORS_REFRESH_RATE
    }
  );

export const dispatchFetchAuctionValidatorsRequest = (): Promise<
  Payload<PaginatedResponse<ValidatorResult> | ErrorResponse>
> => dispatchToMainStore(serviceMessage.fetchAuctionValidatorsRequest());

export const dispatchFetchValidatorsDetailsDataRequest = (
  publicKey: string
): Promise<Payload<PaginatedResponse<DelegatorResult> | ErrorResponse>> =>
  dispatchToMainStore(
    serviceMessage.fetchValidatorsDetailsDataRequest({ publicKey })
  );
