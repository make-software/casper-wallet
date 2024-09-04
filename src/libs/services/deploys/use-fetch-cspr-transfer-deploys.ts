import { useInfiniteQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { accountCsprTransferDeploysDataChanged } from '@background/redux/account-info/actions';
import { selectAccountCsprTransferDeploysData } from '@background/redux/account-info/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { deploysRepository } from '@background/wallet-repositories';

export const useFetchCsprTransferDeploys = () => {
  const csprDeploysData = useSelector(selectAccountCsprTransferDeploysData);

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
        network: network.toLowerCase() as CasperNetwork
      }),
    getNextPageParam: (lastPage, _, lastPageParam) => {
      const nextPage =
        (csprDeploysData?.pageParams.length || lastPageParam) + 1;

      return nextPage <= lastPage.pageCount ? nextPage : undefined;
    },
    initialPageParam: 1
  });

  const csprTransferDeploys = useMemo(
    () =>
      csprDeploysData?.pages
        ?.flat()
        ?.map(t => t.data)
        ?.flat() ?? [],
    [csprDeploysData?.pages]
  );

  useEffect(() => {
    if (isCsprTransferDeploysLoading) return;
    dispatchToMainStore(
      accountCsprTransferDeploysDataChanged(csprTransferDeploysData)
    );
  }, [csprTransferDeploysData, isCsprTransferDeploysLoading]);

  return {
    csprTransferDeploys,
    isCsprTransferDeploysLoading,
    isFetchingCsprTransferDeploysNextPage,
    fetchCsprTransferDeploysNextPage,
    hasCsprTransferDeploysNextPage
  };
};
