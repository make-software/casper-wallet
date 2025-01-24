import { useQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useSelector } from 'react-redux';

import { TOKENS_REFRESH_RATE } from '@src/constants';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { tokensRepository } from '@background/wallet-repositories';

export const useFetchCep18Tokens = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const { data: cep18Tokens, isFetching: isLoadingTokens } = useQuery({
    queryKey: ['CEP18_TOKENS', network, activeAccount?.publicKey],
    queryFn: () =>
      tokensRepository.getTokens({
        network: network.toLowerCase() as CasperNetwork,
        publicKey: activeAccount?.publicKey || '',
        withProxyHeader: false
      }),
    refetchInterval: TOKENS_REFRESH_RATE,
    staleTime: TOKENS_REFRESH_RATE
  });

  return { cep18Tokens, isLoadingTokens };
};
