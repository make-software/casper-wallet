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
  casperClarityApiUrl: string,
  signal?: AbortSignal
) =>
  fetch(getAuctionValidatorsUrl(casperClarityApiUrl), { signal })
    .then(toJson)
    .catch(handleError);

export const validatorsDetailsDataRequest = (
  casperClarityApiUrl: string,
  publicKey: string,
  signal?: AbortSignal
) =>
  fetch(getValidatorsDetailsDataUrl(casperClarityApiUrl, publicKey), { signal })
    .then(toJson)
    .catch(handleError);

export const fetchAuctionValidators = ({
  casperClarityApiUrl
}: {
  casperClarityApiUrl: string;
}): Promise<PaginatedResponse<ValidatorResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['getAuctionValidators', casperClarityApiUrl],
    ({ signal }) => auctionValidatorsRequest(casperClarityApiUrl, signal),
    {
      staleTime: VALIDATORS_REFRESH_RATE
    }
  );

export const fetchValidatorsDetailsData = ({
  casperClarityApiUrl,
  publicKey
}: {
  casperClarityApiUrl: string;
  publicKey: string;
}): Promise<PaginatedResponse<DelegatorResult> | ErrorResponse> =>
  queryClient.fetchQuery(
    ['getDelegations', casperClarityApiUrl, publicKey],
    ({ signal }) =>
      validatorsDetailsDataRequest(casperClarityApiUrl, publicKey, signal),
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
