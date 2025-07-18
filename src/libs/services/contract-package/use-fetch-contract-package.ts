import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { contractPackageRepository } from '@background/wallet-repositories';

export const useFetchContractPackage = (contractPackageHash: Maybe<string>) => {
  const network = useSelector(selectActiveNetworkSetting);

  const { data: contractPackage = null, isFetching: isContractPackageLoading } =
    useQuery({
      queryKey: ['FETCH_CONTRACT_PACKAGE', contractPackageHash, network],
      enabled: Boolean(contractPackageHash),
      queryFn: () =>
        contractPackageHash
          ? contractPackageRepository
              .getContractPackage({
                contractPackageHash,
                withProxyHeader: false,
                network: network.toLowerCase() as CasperNetwork
              })
              // TODO add separate 404 error and improve errors handling
              .catch()
          : null
    });

  return {
    contractPackage,
    isContractPackageLoading
  };
};
