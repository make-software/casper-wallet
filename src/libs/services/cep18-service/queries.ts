import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';

import { NetworkSetting, TOKENS_REFRESH_RATE } from '@src/constants';

import { tokensRepository } from '@background/wallet-repositories';

import { Account } from '@libs/types/account';

interface FetchCep18TokensQueryProps {
  network: NetworkSetting;
  activeAccount: Account | undefined;
}

export const fetchCep18TokensQuery = ({
  network,
  activeAccount
}: FetchCep18TokensQueryProps) => ({
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
