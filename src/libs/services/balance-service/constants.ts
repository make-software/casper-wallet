interface GetAccountBalanceUrl {
  accountHash: string;
  casperWalletApiUrl: string;
}

interface GetAccountsBalanceUrl {
  accountHashes: string;
  casperWalletApiUrl: string;
}

export const getCurrencyRateUrl = (casperClarityApiUrl: string) =>
  `${casperClarityApiUrl}/rates/1/amount`;

export const getAccountBalanceUrl = ({
  accountHash,
  casperWalletApiUrl
}: GetAccountBalanceUrl) =>
  `${casperWalletApiUrl}/accounts/${accountHash}?includes=delegated_balance,undelegating_balance`;

export const getAccountsBalanceUrl = ({
  accountHashes,
  casperWalletApiUrl
}: GetAccountsBalanceUrl) =>
  `${casperWalletApiUrl}/accounts?account_hash=${accountHashes}&page=1&page_size=100&includes=delegated_balance,undelegating_balance`;
