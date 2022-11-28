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

export const fetchHandler = async (url: string) =>
  await fetch(url)
    .then(resp => resp.json())
    .catch(error => {
      console.error(error);
    });

export const getCurrencyRateRequest =
  async (): Promise<GetCurrencyRateRequestResponse> =>
    await fetchHandler(CURRENCY_RATE_URL);

export const getAccountBalanceRequest = async (
  publicKey: string
): Promise<GetAccountBalanceRequestResponse> => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return await fetchHandler(getAccountBalanceUrl({ publicKey }));
};

export const getActiveAccountBalance = async (
  publicKey = ''
): Promise<DataWithPayload<FetchBalanceResponse>> =>
  await browser.runtime.sendMessage(
    sdkMessage.fetchBalanceRequest(
      { publicKey },
      // Temporary solution, need to discuss with Piotr
      { requestId: '' }
    )
  );

export const getAccountBalance = async ({ publicKey }: { publicKey: string }) =>
  await queryClient.fetchQuery(
    ['getAccountBalanceRequest', publicKey],
    () => getAccountBalanceRequest(publicKey),
    {
      // cached for 1 min
      staleTime: 60 * SECOND
    }
  );

export const getCurrencyRate = async () =>
  await queryClient.fetchQuery(
    'getCurrencyRateRequest',
    getCurrencyRateRequest,
    {
      // cached for 1 hr
      staleTime: 360 * SECOND
    }
  );
