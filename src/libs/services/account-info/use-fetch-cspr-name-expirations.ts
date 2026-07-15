import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  CsprNameExpirationInput,
  csprNameExpirationsUpdated
} from '@background/redux/cspr-name-expirations/actions';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultAccountsPublicKeys } from '@background/redux/vault/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

import { runWithConcurrency } from './run-with-concurrency';

const MAX_CONCURRENT_RESOLUTIONS = 5;

export const useFetchCsprNameExpirations = (): void => {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const publicKeys = useSelector(selectVaultAccountsPublicKeys);
  const network = networkSetting.toLowerCase() as CasperNetwork;

  const { data } = useQuery({
    queryKey: ['CSPR_NAME_EXPIRATIONS', network, publicKeys.join(',')],
    enabled: publicKeys.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    // Fetch once per popup session — override the query client's 3-min
    // refetchInterval default so this does not poll while Home is mounted.
    refetchInterval: false,
    queryFn: async () => {
      const accountHashes = publicKeys.map(getAccountHashFromPublicKey);

      const accountsInfo = await accountInfoRepository.getAccountsInfo({
        accountHashes,
        network,
        withProxyHeader: false
      });

      const csprNames = Object.values(accountsInfo)
        .map(info => info.csprName)
        .filter((name): name is string => name != null);

      const resolved = await runWithConcurrency(
        csprNames,
        MAX_CONCURRENT_RESOLUTIONS,
        // Isolate failures: a single rejected resolution must not sink the
        // whole batch (which would leave the banner hidden for every name
        // this session). Treat a failed lookup as "unresolved" (null).
        async csprName => {
          try {
            return await accountInfoRepository.resolveAccountFromCsprName(
              csprName,
              network,
              false
            );
          } catch {
            return null;
          }
        }
      );

      const records: Record<string, CsprNameExpirationInput> = {};
      resolved.forEach(info => {
        if (
          info != null &&
          info.csprName != null &&
          info.csprNameExpiresAt != null
        ) {
          records[info.publicKey] = {
            csprName: info.csprName,
            expiresAt: info.csprNameExpiresAt
          };
        }
      });

      return { network, records };
    }
  });

  useEffect(() => {
    if (data != null) {
      dispatchToMainStore(csprNameExpirationsUpdated(data));
    }
  }, [data]);
};
