export const getErc20TokensUrl = (
  casperClarityApiUrl: string,
  accountHash: string
) =>
  `${casperClarityApiUrl}/accounts/${accountHash}/erc20-tokens?fields=latest_contract,contract_package`;
