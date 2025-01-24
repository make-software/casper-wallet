import { useInfiniteQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { deploysRepository } from '@background/wallet-repositories';

export const useFetchCsprTransferDeploys = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const {
    data: csprTransferDeploysData,
    isLoading: isCsprTransferDeploysLoading,
    isFetchingNextPage: isFetchingCsprTransferDeploysNextPage,
    fetchNextPage: fetchCsprTransferDeploysNextPage,
    hasNextPage: hasCsprTransferDeploysNextPage = false
  } = useInfiniteQuery({
    enabled: Boolean(activeAccount?.publicKey),
    queryKey: ['CSPR_TRANSFER_DEPLOYS', network, activeAccount?.publicKey],
    queryFn: ({ pageParam }) =>
      deploysRepository.getCsprTransferDeploys({
        page: pageParam,
        activePublicKey: activeAccount?.publicKey ?? '',
        network: network.toLowerCase() as CasperNetwork,
        withProxyHeader: false
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;

      return nextPage <= lastPage.pageCount ? nextPage : undefined;
    },
    initialPageParam: 1
  });

  const csprTransferDeploys = useMemo(
    () =>
      csprTransferDeploysData?.pages
        ?.flat()
        ?.map(t => t.data)
        ?.flat() ?? [],
    [csprTransferDeploysData?.pages]
  );

  return {
    csprTransferDeploys,
    isCsprTransferDeploysLoading,
    isFetchingCsprTransferDeploysNextPage,
    fetchCsprTransferDeploysNextPage,
    hasCsprTransferDeploysNextPage
  };
};
