export const getErc20TokenActivityLink = (
  casperClarityApiUrl: string,
  account_hash: string,
  contract_package_hash: string,
  page: number
) =>
  `${casperClarityApiUrl}/erc20-token-actions?contract_package_hash=${contract_package_hash}&account_hash=${account_hash}&page=${page}&limit=10&fields=contract_package,deploy&with_amounts_in_currency_id=1`;
