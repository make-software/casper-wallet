import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

export const useFetchAccountsInfo = (accountPublicKeys: string[]) => {
  const network = useSelector(selectActiveNetworkSetting);

  const accountHashes = useMemo(
    () => accountPublicKeys.map(key => getAccountHashFromPublicKey(key)),
    [accountPublicKeys]
  );

  const accountHashesString = accountHashes.toString();

  const { data: accountsInfo } = useQuery({
    queryKey: ['ACCOUNT_INFO', accountHashesString, network],
    queryFn: async () => {
      return await accountInfoRepository.getAccountsInfo({
        accountHashes,
        network: network.toLowerCase() as CasperNetwork,
        withProxyHeader: false
      });
    }
  });

  return accountsInfo;
};
