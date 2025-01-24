import { useQuery } from '@tanstack/react-query';

import { accountInfoRepository } from '@background/wallet-repositories';

export const useFetchAccountFromCsprName = (csprName: string) => {
  const { data: accountInfo, isFetching: isLoading } = useQuery({
    queryKey: ['ACCOUNT_INFO_FROM_CSPR_NAME', csprName],
    queryFn: () =>
      accountInfoRepository.resolveAccountFromCsprName(csprName, false)
  });

  return { accountInfo, isLoading };
};
