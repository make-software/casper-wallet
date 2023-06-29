export const getErc20TokensUrl = (casperApiUrl: string, accountHash: string) =>
  `${casperApiUrl}/accounts/${accountHash}/erc20-tokens?fields=latest_contract`;

export const getContractPackageUrl = (
  casperApiUrl: string,
  contractPackageHash: string
) => `${casperApiUrl}/contract-packages/${contractPackageHash}`;
