interface GetAccountBalanceUrl {
  publicKey: string;
  casperApiUrl: string;
}

export const getCurrencyRateUrl = (casperApiUrl: string) =>
  `${casperApiUrl}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  publicKey,
  casperApiUrl
}: GetAccountBalanceUrl): string =>
  `${casperApiUrl}/accounts/${publicKey}/balance`;
