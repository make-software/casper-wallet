export const getAccountActivityLink = (
  casperApiUrl: string,
  publicKey: string,
  page: number
) =>
  `${casperApiUrl}/accounts/${publicKey}/ledgerlive-deploys?page=${page}&limit=10&execution_type_id=6`;

export const getErc20AccountActivityLink = (
  casperApiUrl: string,
  account_hash: string,
  page: number
) =>
  `${casperApiUrl}/accounts/${account_hash}/erc20-token-actions?page=${page}&limit=10&fields=deploy&with_amounts_in_currency_id=1`;

export const getErc20TokenActivityLink = (
  casperApiUrl: string,
  account_hash: string,
  contract_package_hash: string,
  page: number
) =>
  `${casperApiUrl}/erc20-token-actions?contract_package_hash=${contract_package_hash}&account_hash=${account_hash}&page=${page}&limit=10&fields=deploy&with_amounts_in_currency_id=1`;

export const getExtendedDeploysHashLink = (
  casperApiUrl: string,
  deployHash: string
) =>
  `${casperApiUrl}/extended-deploys/${deployHash}?fields=entry_point,contract_package&with_amounts_in_currency_id=1`;
