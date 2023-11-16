export const getAuctionValidatorsUrl = (casperApiUrl: string) =>
  `${casperApiUrl}/auction-validators?page=1&limit=-1&fields=account_info,average_performance&is_active=true`;

export const getValidatorsDetailsDataUrl = (
  casperApiUrl: string,
  publicKey: string
) => `
  ${casperApiUrl}/accounts/${publicKey}/delegations?page=1&limit=100&fields=validator,validator_account_info
`;
