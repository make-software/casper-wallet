export const getAccountActivityLink = (
  casperApiUrl: string,
  publicKey: string,
  page: number
) =>
  `${casperApiUrl}/accounts/${publicKey}/ledgerlive-deploys?page=${page}&limit=10&execution_type_id=6`;

export const getExtendedDeploysHashLink = (
  casperApiUrl: string,
  deployHash: string
) =>
  `${casperApiUrl}/extended-deploys/${deployHash}?fields=entry_point,contract_package&with_amounts_in_currency_id=1`;
