interface GetAccountBalanceUrl {
  publicKey: string;
}

// const BASE_URL_MAINNET = 'https://casper-api.dev.make.services';
const BASE_URL_TESTNET =
  'https://event-store-api-clarity-testnet.make.services';

export const CURRENCY_RATE_URL = `${BASE_URL_TESTNET}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  publicKey
}: GetAccountBalanceUrl): string =>
  `${BASE_URL_TESTNET}/accounts/${publicKey}/balance`;

export const SECOND = 1000;
