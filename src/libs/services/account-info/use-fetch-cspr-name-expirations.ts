import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { getCasperNetwork } from '@src/constants';

import { csprNameExpirationsUpdated } from '@background/redux/cspr-name-expirations/actions';
import { selectCsprNameExpirations } from '@background/redux/cspr-name-expirations/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultAccountsPublicKeys } from '@background/redux/vault/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

import { getAccountsInfoQueryOptions } from './accounts-info-query';
import { getCsprNameExpirations } from './get-cspr-name-expirations';

export const useFetchCsprNameExpirations = (): void => {
  const queryClient = useQueryClient();
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const accountPublicKeys = useSelector(selectVaultAccountsPublicKeys);
  const csprNameExpirations = useSelector(selectCsprNameExpirations);

  const network = getCasperNetwork(networkSetting);

  useQuery({
    queryKey: ['CSPR_NAME_EXPIRATIONS', accountPublicKeys.toString(), network],
    enabled: accountPublicKeys.length > 0,
    // Fetch once per popup session per network: refetchInterval:false overrides
    // the query client's 3-minute polling default.
    staleTime: Infinity,
    refetchInterval: false,
    queryFn: async () => {
      try {
        // Reuses the ACCOUNT_INFO cache entry `useFetchAccountsInfo` fills.
        const accountsInfo = await queryClient.ensureQueryData(
          getAccountsInfoQueryOptions(accountPublicKeys, networkSetting)
        );

        const { expirations, failedPublicKeys } = await getCsprNameExpirations(
          accountPublicKeys,
          accountsInfo,
          network,
          accountInfoRepository,
          csprNameExpirations[network] ?? {},
          Date.now()
        );

        dispatchToMainStore(
          csprNameExpirationsUpdated({ network, expirations, failedPublicKeys })
        );

        return expirations;
      } catch (error) {
        // The query error is consumed nowhere, so a failed fetch would hide the
        // banner for the whole popup session with nothing to debug from.
        console.error(error);

        throw error;
      }
    }
  });
};
