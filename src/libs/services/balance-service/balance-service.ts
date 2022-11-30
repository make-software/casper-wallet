import browser from 'webextension-polyfill';
import { QueryClient } from 'react-query';

import { sdkMessage } from '@content/sdk-message';

import {
  DataWithPayload,
  FetchBalanceResponse,
  GetAccountBalanceRequestResponse,
  GetCurrencyRateRequestResponse
} from './types';
import { CURRENCY_RATE_URL, getAccountBalanceUrl, SECOND } from './constants';

const queryClient = new QueryClient();

const toJson = (res: Response): Promise<any> => res.json();

export const getCurrencyRateRequest =
  (): Promise<GetCurrencyRateRequestResponse> =>
    fetch(CURRENCY_RATE_URL)
      .then(toJson)
      .catch(error => {
        console.error(error);
      });

export const getAccountBalanceRequest = (
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
    .catch(error => {
      console.error(error);
    });
};

export const getActiveAccountBalance = (
  publicKey = ''
): Promise<DataWithPayload<FetchBalanceResponse>> =>
  browser.runtime.sendMessage(
    sdkMessage.fetchBalanceRequest(
      { publicKey },
      // Temporary solution, need to discuss with Piotr
      { requestId: '' }
    )
  );

export const getAccountBalance = ({ publicKey }: { publicKey: string }) =>
  queryClient.fetchQuery(
    ['getAccountBalanceRequest', publicKey],
    () => getAccountBalanceRequest(publicKey),
    {
      // cached for 1 min
      staleTime: 60 * SECOND
    }
  );

export const getCurrencyRate = () =>
  queryClient.fetchQuery('getCurrencyRateRequest', getCurrencyRateRequest, {
    // cached for 1 hr
    staleTime: 360 * SECOND
  });
