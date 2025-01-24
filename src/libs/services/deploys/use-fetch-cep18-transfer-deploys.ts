import { useInfiniteQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { deploysRepository } from '@background/wallet-repositories';

export const useFetchCep18TransferDeploys = (contractPackageHash: string) => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const {
    data: cep18TransferDeploysData,
    isLoading: isCep18TransferDeploysLoading,
    fetchNextPage: fetchCep18TransferDeploysNextPage,
    hasNextPage: hasCep18TransferDeploysNextPage = false
  } = useInfiniteQuery({
    queryKey: [
      'CEP18_TRANSFER_DEPLOYS',
      network,
      activeAccount?.publicKey,
      contractPackageHash
    ],
    enabled: Boolean(activeAccount?.publicKey),
    queryFn: ({ pageParam }) =>
      deploysRepository.getCep18TransferDeploys({
        network: network.toLowerCase() as CasperNetwork,
        activePublicKey: activeAccount?.publicKey ?? '',
        contractPackageHash,
        page: pageParam,
        withProxyHeader: false
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;

      return nextPage <= lastPage.pageCount ? nextPage : undefined;
    },
    initialPageParam: 1
  });

  const cep18TransferDeploys = useMemo(
    () =>
      cep18TransferDeploysData?.pages
        ?.flat()
        ?.map(t => t.data)
        ?.flat() ?? [],
    [cep18TransferDeploysData?.pages]
  );

  return {
    cep18TransferDeploys,
    isCep18TransferDeploysLoading,
    hasCep18TransferDeploysNextPage,
    fetchCep18TransferDeploysNextPage
  };
};
