export const getNftTokensUrl = (
  casperApiUrl: string,
  accountHash: string,
  page: number
) =>
  `${casperApiUrl}/accounts/${accountHash}/nft-tokens?page=${page}&limit=10&fields=contract_package`;
