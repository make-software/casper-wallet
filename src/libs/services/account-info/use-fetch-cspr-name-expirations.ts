import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { getCasperNetwork } from '@src/constants';

import { csprNameExpirationsUpdated } from '@background/redux/cspr-name-expirations/actions';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultAccountsPublicKeys } from '@background/redux/vault/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

import { handleError } from '../utils';
import { getCsprNameExpirations } from './get-cspr-name-expirations';

export const useFetchCsprNameExpirations = (): void => {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const accountPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  const network = getCasperNetwork(networkSetting);

  useQuery({
    queryKey: ['CSPR_NAME_EXPIRATIONS', accountPublicKeys.toString(), network],
    enabled: accountPublicKeys.length > 0,
    // Fetch once per popup session per network: staleTime keeps the cached
    // result fresh and refetchInterval:false overrides the query client's
    // 3-minute polling default so this does not re-run while Home is mounted.
    staleTime: Infinity,
    refetchInterval: false,
    queryFn: async () => {
      try {
        const { expirations, failedPublicKeys } = await getCsprNameExpirations(
          accountPublicKeys,
          network,
          accountInfoRepository
        );

        dispatchToMainStore(
          csprNameExpirationsUpdated({ network, expirations, failedPublicKeys })
        );

        return expirations;
      } catch (error) {
        // The query error is consumed nowhere (no retry, no polling), so log
        // it here — otherwise a failed fetch leaves the banner silently
        // hidden for the whole popup session with nothing to debug from.
        handleError(error as Error);

        throw error;
      }
    }
  });
};
