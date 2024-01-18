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
  `${casperCloudApiUrl}/accounts?account_hashes=${accountHash}&page=1&page_size=1&order_direction=DESC&order_by=balance&includes=delegated_balance,undelegating_balance`;
