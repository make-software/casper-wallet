import browser from 'webextension-polyfill';

import { motesToCSPR, motesToCurrency } from '@libs/ui/utils/formatters';
import { sdkMessage } from '@content/sdk-message';

import {
  ActiveAccountBalance,
  GetAccountBalanceResponse,
  GetCurrencyRateResponse,
  DataWithPayload,
  FetchBalanceResponse
} from './types';
import { CURRENCY_RATE_URL, getAccountBalanceUrl } from './constants';

export const simpleFetchHandler = async (url: string) =>
  await fetch(url)
    .then(resp => resp.json())
    .catch(error => {
      console.error(error);
    });

export const getCurrencyRate = async (): Promise<GetCurrencyRateResponse> =>
  await simpleFetchHandler(CURRENCY_RATE_URL);

export const getAccountBalance = async (
  publicKey: string
): Promise<GetAccountBalanceResponse> => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return await simpleFetchHandler(getAccountBalanceUrl(publicKey));
};

export const getActiveAccountBalance = async (
  publicKey = ''
): Promise<ActiveAccountBalance> => {
  const {
    payload: { balance, currencyRate }
  }: DataWithPayload<FetchBalanceResponse> = await browser.runtime.sendMessage(
    sdkMessage.fetchBalanceRequest(
      { publicKey },
      // Temporary solution, need to discuss with Piotr
      { requestId: '' }
    )
  );
  // In case when get account balance request failed
  let amount = '0';
  let fiatAmount = '0';

  if (balance) {
    amount = motesToCSPR(balance);
    fiatAmount = motesToCurrency(balance, currencyRate);
  }

  return {
    amount,
    fiatAmount
  };
};
