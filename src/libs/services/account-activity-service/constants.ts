// TODO: change link to casperApiUrl after endpoint will be ready for use at testnet and mainnet
export const getAccountActivityLink = (publicKey: string, page: number) =>
  `https://casper-api.dev.make.services/accounts/${publicKey}/ledgerlive-deploys?page=${page}&limit=10&execution_type_id=6`;

export const getExtendedDeploysHashLink = (
  casperApiUrl: string,
  deployHash: string
) =>
  `${casperApiUrl}/extended-deploys/${deployHash}?fields=entry_point,contract_package&with_amounts_in_currency_id=1`;
