import { useInfiniteQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { accountCep18TransferDeploysDataChanged } from '@background/redux/account-info/actions';
import { selectAccountCep18TransferDeploysData } from '@background/redux/account-info/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { deploysRepository } from '@background/wallet-repositories';

export const useFetchCep18TransferDeploys = (contractPackageHash: string) => {
  const cep18DeploysDataRecord = useSelector(
    selectAccountCep18TransferDeploysData
  );

  const cep18DeploysData = cep18DeploysDataRecord
    ? cep18DeploysDataRecord[contractPackageHash || '']
    : null;

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
        page: pageParam
      }),
    getNextPageParam: (lastPage, _, lastPageParam) => {
      const nextPage =
        (cep18DeploysData?.pageParams.length || lastPageParam) + 1;

      return nextPage <= lastPage.pageCount ? nextPage : undefined;
    },
    initialPageParam: 1
  });

  const cep18TransferDeploys = useMemo(
    () =>
      cep18DeploysData?.pages
        ?.flat()
        ?.map(t => t.data)
        ?.flat() ?? [],
    [cep18DeploysData?.pages]
  );

  useEffect(() => {
    if (isCep18TransferDeploysLoading) return;

    dispatchToMainStore(
      accountCep18TransferDeploysDataChanged({
        cep18TransferDeploysData,
        contractPackageHash
      })
    );
  }, [
    cep18TransferDeploysData,
    contractPackageHash,
    isCep18TransferDeploysLoading
  ]);

  return {
    cep18TransferDeploys,
    isCep18TransferDeploysLoading,
    hasCep18TransferDeploysNextPage,
    fetchCep18TransferDeploysNextPage
  };
};
