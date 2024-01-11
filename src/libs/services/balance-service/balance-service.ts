import { BALANCE_REFRESH_RATE, CURRENCY_REFRESH_RATE } from '@src/constants';

import { dispatchToMainStore } from '@background/redux/utils';
import { serviceMessage } from '@background/service-message';

import { Payload } from '@libs/services/types';

import { queryClient } from '../query-client';
import { handleError, toJson } from '../utils';
import { getAccountBalanceUrl, getCurrencyRateUrl } from './constants';
import {
  FetchBalanceResponse,
  GetAccountBalanceRequestResponse,
  GetCurrencyRateRequestResponse
} from './types';

export const currencyRateRequest = (
  casperApiUrl: string,
  signal?: AbortSignal
): Promise<GetCurrencyRateRequestResponse> =>
  fetch(getCurrencyRateUrl(casperApiUrl), { signal })
    .then(toJson)
    .catch(handleError);

export const accountBalanceRequest = (
  publicKey: string,
  casperApiUrl: string,
  signal?: AbortSignal
): Promise<GetAccountBalanceRequestResponse> => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return fetch(getAccountBalanceUrl({ publicKey, casperApiUrl }), { signal })
    .then(res => {
      if (res.status === 404) {
        return {
          data: '0'
        };
      }

      return toJson(res);
    })
    .catch(handleError);
};

export const dispatchFetchActiveAccountBalance = (
  publicKey = ''
): Promise<Payload<FetchBalanceResponse>> =>
  dispatchToMainStore(serviceMessage.fetchBalanceRequest({ publicKey }));

export const fetchAccountBalance = ({
  publicKey,
  casperApiUrl
}: {
  publicKey: string;
  casperApiUrl: string;
}) =>
  queryClient.fetchQuery(
    ['getAccountBalanceRequest', publicKey, casperApiUrl],
    ({ signal }) => accountBalanceRequest(publicKey, casperApiUrl, signal),
    {
      staleTime: BALANCE_REFRESH_RATE
    }
  );

export const fetchCurrencyRate = ({ casperApiUrl }: { casperApiUrl: string }) =>
  queryClient.fetchQuery(
    'getCurrencyRateRequest',
    ({ signal }) => currencyRateRequest(casperApiUrl, signal),
    {
      staleTime: CURRENCY_REFRESH_RATE
    }
  );
