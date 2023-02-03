import { serviceMessage } from '@src/background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';

import { DataWithPayload } from '@libs/services/types';

import { FETCH_QUERY_OPTIONS } from '@src/constants';

import { handleError, toJson } from '../utils';
import { queryClient } from '../query-client';

import {
  FetchBalanceResponse,
  GetAccountBalanceRequestResponse,
  GetCurrencyRateRequestResponse
} from './types';
import { CURRENCY_RATE_URL, getAccountBalanceUrl } from './constants';

export const currencyRateRequest =
  (): Promise<GetCurrencyRateRequestResponse> =>
    fetch(CURRENCY_RATE_URL).then(toJson).catch(handleError);

export const accountBalanceRequest = (
  publicKey: string
): Promise<GetAccountBalanceRequestResponse> => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return fetch(getAccountBalanceUrl({ publicKey }))
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

export const dispatchActiveAccountBalance = (
  publicKey = ''
): Promise<DataWithPayload<FetchBalanceResponse>> =>
  dispatchToMainStore(serviceMessage.fetchBalanceRequest({ publicKey }));

export const fetchAccountBalance = ({ publicKey }: { publicKey: string }) =>
  queryClient.fetchQuery(
    ['getAccountBalanceRequest', publicKey],
    () => accountBalanceRequest(publicKey),
    {
      staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
    }
  );

export const fetchCurrencyRate = () =>
  queryClient.fetchQuery('getCurrencyRateRequest', currencyRateRequest, {
    staleTime: FETCH_QUERY_OPTIONS.apiCacheTime
  });
