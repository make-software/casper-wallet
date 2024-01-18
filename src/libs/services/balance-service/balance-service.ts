import { BALANCE_REFRESH_RATE, CURRENCY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { PaginatedResponse, Payload } from '@libs/services/types';

import { queryClient } from '../query-client';
import { handleError, toJson } from '../utils';
import { getAccountBalanceUrl, getCurrencyRateUrl } from './constants';
import {
  AccountData,
  FetchBalanceResponse,
  GetCurrencyRateRequestResponse
} from './types';

export const currencyRateRequest = (
  casperClarityApiUrl: string,
  signal?: AbortSignal
): Promise<GetCurrencyRateRequestResponse> =>
  fetch(getCurrencyRateUrl(casperClarityApiUrl), { signal })
    .then(toJson)
    .catch(handleError);

export const accountBalanceRequest = (
  accountHash: string,
  casperCloudApiUrl: string,
  signal?: AbortSignal
): Promise<AccountData> => {
  if (!accountHash) {
    throw Error('Missing account hash');
  }

  return fetch(getAccountBalanceUrl({ accountHash, casperCloudApiUrl }), {
    signal
  })
    .then(toJson)
    .catch(handleError);
};

export const dispatchFetchActiveAccountBalance = (
  accountHash = ''
): Promise<Payload<FetchBalanceResponse>> =>
  dispatchToMainStore(serviceMessage.fetchBalanceRequest({ accountHash }));

export const fetchAccountBalance = ({
  accountHash,
  casperCloudApiUrl
}: {
  accountHash: string;
  casperCloudApiUrl: string;
}): Promise<PaginatedResponse<AccountData>> =>
  queryClient.fetchQuery(
    ['getAccountBalanceRequest', accountHash, casperCloudApiUrl],
    ({ signal }) =>
      accountBalanceRequest(accountHash, casperCloudApiUrl, signal),
    {
      staleTime: BALANCE_REFRESH_RATE
    }
  );

export const fetchCurrencyRate = ({
  casperClarityApiUrl
}: {
  casperClarityApiUrl: string;
}) =>
  queryClient.fetchQuery(
    'getCurrencyRateRequest',
    ({ signal }) => currencyRateRequest(casperClarityApiUrl, signal),
    {
      staleTime: CURRENCY_REFRESH_RATE
    }
  );
