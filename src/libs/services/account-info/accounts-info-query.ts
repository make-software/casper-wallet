import { NetworkSetting, getCasperNetwork } from '@src/constants';

import { accountInfoRepository } from '@background/wallet-repositories';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

/**
 * Single source of truth for the accounts-info query. Every consumer that
 * needs this data — the `useFetchAccountsInfo` hook and the cspr.name
 * expirations pipeline — must build the query through this factory so they
 * share one cache entry instead of issuing duplicate network requests.
 */
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
