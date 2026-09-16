import { NetworkSetting, getCasperNetwork } from '@src/constants';

import { accountInfoRepository } from '@background/wallet-repositories';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

/** Built through this factory so every consumer shares one cache entry. */
export const getAccountsInfoQueryOptions = (
  accountPublicKeys: string[],
  networkSetting: NetworkSetting
) => {
  const accountHashes = accountPublicKeys.map(getAccountHashFromPublicKey);

  return {
    queryKey: ['ACCOUNT_INFO', accountHashes.toString(), networkSetting],
    queryFn: () =>
      accountInfoRepository.getAccountsInfo({
        accountHashes,
        network: getCasperNetwork(networkSetting),
        withProxyHeader: false
      })
  };
};
