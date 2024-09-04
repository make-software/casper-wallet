import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { IDeploy } from 'casper-wallet-core';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { PENDING_DEPLOY_REFETCH_INTERVAL } from '@src/constants';

import {
  accountDeploysDataChanged,
  accountPendingDeployHashesRemove
} from '@background/redux/account-info/actions';
import {
  selectAccountDeploysData,
  selectPendingDeployHashes
} from '@background/redux/account-info/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { deploysRepository } from '@background/wallet-repositories';

export const useFetchDeploys = () => {
  const deploysDataFromStore = useSelector(selectAccountDeploysData);
  const pendingDeployHashes = useSelector(selectPendingDeployHashes);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const hasPendingDeploys = Boolean(pendingDeployHashes.length);

  const {
    data: deploysData,
    isLoading: isDeploysLoading,
    refetch: refetchDeploys,
    fetchNextPage: fetchDeploysNextPage,
    hasNextPage: hasDeploysNextPage = false
  } = useInfiniteQuery({
    queryKey: ['DEPLOYS', network, activeAccount?.publicKey],
    enabled: Boolean(activeAccount?.publicKey),
    queryFn: ({ pageParam }) =>
      deploysRepository.getDeploys({
        activePublicKey: activeAccount?.publicKey ?? '',
        network: network.toLowerCase() as CasperNetwork,
        page: pageParam
      }),
    getNextPageParam: (lastPage, _, lastPageParam) => {
      const nextPage =
        (deploysDataFromStore?.pageParams.length || lastPageParam) + 1;

      return nextPage <= lastPage.page_count ? nextPage : undefined;
    },
    initialPageParam: 1
  });

  const { data: pendingDeploys = [], isLoading: isPendingDeploysLoading } =
    useQuery({
      queryKey: [
        'PENDING_DEPLOYS',
        network,
        activeAccount?.publicKey,
        pendingDeployHashes
      ],
      enabled: Boolean(activeAccount?.publicKey && hasPendingDeploys),
      queryFn: async (): Promise<IDeploy[]> => {
        const promises = pendingDeployHashes.map(hash =>
          deploysRepository.getSingleDeploy({
            deployHash: hash,
            activePublicKey: activeAccount?.publicKey ?? '',
            network: network.toLowerCase() as CasperNetwork
          })
        );

        const deploys = await Promise.all(promises);

        return deploys.filter((d): d is IDeploy => Boolean(d));
      },
      staleTime: PENDING_DEPLOY_REFETCH_INTERVAL,
      gcTime: PENDING_DEPLOY_REFETCH_INTERVAL,
      refetchInterval: PENDING_DEPLOY_REFETCH_INTERVAL,
      retry: 3
    });

  const flattenedDeploys = useMemo(
    () =>
      deploysDataFromStore?.pages
        ?.flat()
        ?.map(t => t.data)
        ?.flat() ?? [],
    [deploysDataFromStore?.pages]
  );

  const deploys = useMemo(() => {
    return [
      // pending deploys fetched separately due to api restriction
      ...pendingDeploys,
      ...flattenedDeploys.filter(
        d =>
          !pendingDeploys
            .map(pd => pd.deployHash.toLowerCase())
            .includes(d.deployHash.toLowerCase())
      )
    ];
  }, [pendingDeploys, flattenedDeploys]);

  useEffect(() => {
    if (isDeploysLoading) return;
    dispatchToMainStore(accountDeploysDataChanged(deploysData));
  }, [deploysData, isDeploysLoading]);

  useEffect(() => {
    if (isPendingDeploysLoading) return;
    const notPendingDeploys = pendingDeploys.filter(
      d => d.status !== 'pending'
    );

    notPendingDeploys.forEach(deploy => {
      dispatchToMainStore(
        accountPendingDeployHashesRemove(deploy.deployHash)
      ).finally(refetchDeploys);
    });
  }, [isPendingDeploysLoading, pendingDeploys, refetchDeploys]);

  return {
    deploys,
    isDeploysLoading: isDeploysLoading || isPendingDeploysLoading,
    fetchDeploysNextPage,
    hasDeploysNextPage
  };
};
