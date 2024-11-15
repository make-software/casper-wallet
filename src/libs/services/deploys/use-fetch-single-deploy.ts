import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useSelector } from 'react-redux';

import { DEPLOY_DETAILS_REFRESH_RATE } from '@src/constants';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { deploysRepository } from '@background/wallet-repositories';

export const useFetchSingleDeploy = (deployHash?: string) => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const { data: deployData, isLoading: isDeployLoading } = useQuery({
    queryKey: ['DEPLOY', network, activeAccount?.publicKey, deployHash],
    queryFn: () =>
      deploysRepository.getSingleDeploy({
        deployHash: deployHash ?? '',
        activePublicKey: activeAccount?.publicKey ?? '',
        network: network.toLowerCase() as CasperNetwork
      }),
    enabled: Boolean(deployHash && activeAccount?.publicKey),
    refetchInterval: DEPLOY_DETAILS_REFRESH_RATE,
    staleTime: DEPLOY_DETAILS_REFRESH_RATE
  });

  return {
    deployData,
    isLoading: isDeployLoading
  };
};
