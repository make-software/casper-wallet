import { getCasperApiUrl } from '@src/constants';

interface GetAccountBalanceUrl {
  publicKey: string;
}

export const CURRENCY_RATE_URL = `${getCasperApiUrl()}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  publicKey
}: GetAccountBalanceUrl): string =>
  `${getCasperApiUrl()}/accounts/${publicKey}/balance`;
