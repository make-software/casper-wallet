interface GetAccountBalanceUrl {
  accountHash: string;
  casperCloudApiUrl: string;
}

export const getCurrencyRateUrl = (casperClarityApiUrl: string) =>
  `${casperClarityApiUrl}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  accountHash,
  casperCloudApiUrl
}: GetAccountBalanceUrl) =>
  `${casperCloudApiUrl}/accounts/${accountHash}?includes=delegated_balance,undelegating_balance`;
