import { serviceMessage } from '@src/background/service-message';
import { dispatchToMainStore } from '@background/redux/utils';

import { Payload } from '@libs/services/types';

import { BALANCE_REFRESH_RATE, CURRENCY_REFRESH_RATE } from '@src/constants';

import { handleError, toJson } from '../utils';
import { queryClient } from '../query-client';

import {
  FetchBalanceResponse,
  GetAccountBalanceRequestResponse,
  GetCurrencyRateRequestResponse
} from './types';
import { getCurrencyRateUrl, getAccountBalanceUrl } from './constants';

export const currencyRateRequest = (
  casperApiUrl: string
): Promise<GetCurrencyRateRequestResponse> =>
  fetch(getCurrencyRateUrl(casperApiUrl)).then(toJson).catch(handleError);

export const accountBalanceRequest = (
  publicKey: string,
  casperApiUrl: string
): Promise<GetAccountBalanceRequestResponse> => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return fetch(getAccountBalanceUrl({ publicKey, casperApiUrl }))
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
    () => accountBalanceRequest(publicKey, casperApiUrl),
    {
      staleTime: BALANCE_REFRESH_RATE
    }
  );

export const fetchCurrencyRate = ({ casperApiUrl }: { casperApiUrl: string }) =>
  queryClient.fetchQuery(
    'getCurrencyRateRequest',
    () => currencyRateRequest(casperApiUrl),
    {
      staleTime: CURRENCY_REFRESH_RATE
    }
  );
