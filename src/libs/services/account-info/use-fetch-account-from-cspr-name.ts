import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

export const useFetchAccountFromCsprName = (csprName: string) => {
  const network = useSelector(selectActiveNetworkSetting);

  const { data: accountInfo, isFetching: isLoading } = useQuery({
    queryKey: ['ACCOUNT_INFO_FROM_CSPR_NAME', csprName],
    queryFn: () =>
      accountInfoRepository.resolveAccountFromCsprName(
        csprName,
        network.toLowerCase() as CasperNetwork,
        false
      )
  });

  return { accountInfo, isLoading };
};
