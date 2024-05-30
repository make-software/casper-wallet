export const getAccountActivityLink = (
  casperClarityApiUrl: string,
  publicKey: string,
  page: number
) =>
  `${casperClarityApiUrl}/accounts/${publicKey}/ledgerlive-deploys?page=${page}&limit=10&execution_type_id=6`;

export const getErc20AccountActivityLink = (
  casperClarityApiUrl: string,
  account_hash: string,
  page: number
) =>
  `${casperClarityApiUrl}/accounts/${account_hash}/erc20-token-actions?page=${page}&limit=10&fields=contract_package,deploy&with_amounts_in_currency_id=1`;

export const getErc20TokenActivityLink = (
  casperClarityApiUrl: string,
  account_hash: string,
  contract_package_hash: string,
  page: number
) =>
  `${casperClarityApiUrl}/erc20-token-actions?contract_package_hash=${contract_package_hash}&account_hash=${account_hash}&page=${page}&limit=10&fields=contract_package,deploy&with_amounts_in_currency_id=1`;

export const getExtendedDeploysHashLink = (
  casperClarityApiUrl: string,
  deployHash: string
) =>
  `${casperClarityApiUrl}/extended-deploys/${deployHash}?fields=entry_point,contract_package&with_amounts_in_currency_id=1`;

export const getAccountExtendedDeploysLink = (
  casperClarityApiUrl: string,
  publicKey: string,
  page: number
) =>
  `${casperClarityApiUrl}/accounts/${publicKey}/extended-deploys?page=${page}&limit=10&fields=entry_point,contract_package&with_amounts_in_currency_id=1`;

export const getAccountTransferLink = (
  casperClarityApiUrl: string,
  account_hash: string,
  page: number
) =>
  `${casperClarityApiUrl}/accounts/${account_hash}/transfers?page=${page}&limit=10&with_extended_info=1&with_amounts_in_currency_id=1`;
