export const CURRENCY_RATE_URL =
  'https://casper-api.dev.make.services/rates/1/amount';

export const getAccountBalanceUrl = (publicKey: string): string =>
  `https://casper-api.dev.make.services/accounts/${publicKey}/balance`;
