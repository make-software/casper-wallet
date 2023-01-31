import { BASE_URL_TESTNET } from '@src/constants';

interface GetAccountBalanceUrl {
  publicKey: string;
}

export const CURRENCY_RATE_URL = `${BASE_URL_TESTNET}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  publicKey
}: GetAccountBalanceUrl): string =>
  `${BASE_URL_TESTNET}/accounts/${publicKey}/balance`;
