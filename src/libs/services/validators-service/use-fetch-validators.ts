import { useQueries } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useSelector } from 'react-redux';

import { VALIDATORS_REFRESH_RATE } from '@src/constants';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { validatorsRepository } from '@background/wallet-repositories';

export const useFetchValidators = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const {
    validators,
    validatorsWithStakes,
    isLoadingValidators,
    isLoadingValidatorsWithStakes
  } = useQueries({
    queries: [
      {
        queryKey: ['VALIDATORS', network],
        queryFn: () =>
          validatorsRepository.getValidators({
            network: network.toLowerCase() as CasperNetwork,
            withProxyHeader: false
          }),
        staleTime: VALIDATORS_REFRESH_RATE
      },
      {
        queryKey: ['VALIDATORS_WITH_STAKE', network, activeAccount?.publicKey],
        queryFn: () =>
          validatorsRepository.getValidatorsWithStakes({
            network: network.toLowerCase() as CasperNetwork,
            publicKey: activeAccount?.publicKey || '',
            withProxyHeader: false
          }),
        staleTime: VALIDATORS_REFRESH_RATE
      }
    ],
    combine: results => {
      const validators = results[0].data || null;
      const isLoadingValidators = results[0].isLoading;
      const validatorsWithStakes = results[1].data || null;
      const isLoadingValidatorsWithStakes = results[1].isLoading;

      return {
        validators,
        validatorsWithStakes,
        isLoadingValidators,
        isLoadingValidatorsWithStakes
      };
    }
  });

  return {
    validators,
    validatorsWithStakes,
    isLoadingValidators,
    isLoadingValidatorsWithStakes
  };
};
