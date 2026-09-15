import {
  NetworkSetting,
  TOKENS_REFRESH_RATE,
  getCasperNetwork
} from '@src/constants';

import { swapRepository } from '@background/wallet-repositories';

interface FetchDexTokensQueryProps {
  network: NetworkSetting;
}

export const fetchDexTokensQuery = ({ network }: FetchDexTokensQueryProps) => ({
  queryKey: ['DEX_TOKENS', network],
  queryFn: () =>
    swapRepository.getDexTokens({ network: getCasperNetwork(network) }),
  refetchInterval: TOKENS_REFRESH_RATE,
  staleTime: TOKENS_REFRESH_RATE
});
