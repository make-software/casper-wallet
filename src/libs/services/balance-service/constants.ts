import { GetAccountBalanceUrl } from '@libs/services/balance-service/types';

const BASE_URL = 'https://casper-api.dev.make.services';

export const CURRENCY_RATE_URL = `${BASE_URL}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  publicKey
}: GetAccountBalanceUrl): string => `${BASE_URL}/accounts/${publicKey}/balance`;

export const SECOND = 1000;
