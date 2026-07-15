import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core';
import { useSelector } from 'react-redux';

import { csprNameExpirationsUpdated } from '@background/redux/cspr-name-expirations/actions';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultAccountsPublicKeys } from '@background/redux/vault/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

import { getCsprNameExpirations } from './get-cspr-name-expirations';

export const useFetchCsprNameExpirations = (): void => {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const accountPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  const network = networkSetting.toLowerCase() as CasperNetwork;

  useQuery({
    queryKey: ['CSPR_NAME_EXPIRATIONS', accountPublicKeys.toString(), network],
    enabled: accountPublicKeys.length > 0,
    // Fetch once per popup session per network: staleTime keeps the cached
    // result fresh and refetchInterval:false overrides the query client's
    // 3-minute polling default so this does not re-run while Home is mounted.
    staleTime: Infinity,
    refetchInterval: false,
    queryFn: async () => {
      const expirations = await getCsprNameExpirations(
        accountPublicKeys,
        network,
        accountInfoRepository
      );

      dispatchToMainStore(csprNameExpirationsUpdated({ network, expirations }));

      return expirations;
    }
  });
};
