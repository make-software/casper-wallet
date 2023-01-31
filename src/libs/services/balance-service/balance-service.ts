import browser from 'webextension-polyfill';

import { serviceMessage } from '@src/background/service-message';

import { DataWithPayload } from '@libs/services/types';

import { SECOND } from '@src/constants';

import { handleError, toJson } from '../utils';
import { queryClient } from '../query-client';

import {
  FetchBalanceResponse,
  GetAccountBalanceRequestResponse,
  GetCurrencyRateRequestResponse
} from './types';
import { CURRENCY_RATE_URL, getAccountBalanceUrl } from './constants';

export const getCurrencyRateRequest =
  (): Promise<GetCurrencyRateRequestResponse> =>
    fetch(CURRENCY_RATE_URL).then(toJson).catch(handleError);

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
    .catch(handleError);
};

export const getActiveAccountBalance = (
  publicKey = ''
): Promise<DataWithPayload<FetchBalanceResponse>> =>
  browser.runtime.sendMessage(
    serviceMessage.fetchBalanceRequest({ publicKey })
  );

export const getAccountBalance = ({ publicKey }: { publicKey: string }) =>
  queryClient.fetchQuery(
    ['getAccountBalanceRequest', publicKey],
    () => getAccountBalanceRequest(publicKey),
    {
      // cached for 30 sec
      staleTime: 30 * SECOND
    }
  );

export const getCurrencyRate = () =>
  queryClient.fetchQuery('getCurrencyRateRequest', getCurrencyRateRequest, {
    // cached for 30 sec
    staleTime: 30 * SECOND
  });
