export const getNftTokensUrl = (
  casperClarityApiUrl: string,
  accountHash: string,
  page: number
) =>
  `${casperClarityApiUrl}/accounts/${accountHash}/nft-tokens?page=${page}&limit=10&fields=contract_package`;
