interface GetAccountBalanceUrl {
  accountHash: string;
  casperWalletApiUrl: string;
}

export const getCurrencyRateUrl = (casperClarityApiUrl: string) =>
  `${casperClarityApiUrl}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  accountHash,
  casperWalletApiUrl
}: GetAccountBalanceUrl) =>
  `${casperWalletApiUrl}/accounts/${accountHash}?includes=delegated_balance,undelegating_balance`;
