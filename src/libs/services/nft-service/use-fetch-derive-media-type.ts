import { useQuery } from '@tanstack/react-query';
import { Maybe } from 'casper-wallet-core/src/typings/common';

import { nftsRepository } from '@background/wallet-repositories';

export const useFetchDeriveMediaType = (url?: Maybe<string>) => {
  const { data: contentType, isFetching: isLoadingMediaType } = useQuery({
    queryKey: ['deriveNftMediaType', url],
    queryFn: () => nftsRepository.deriveNftMediaType(url || ''),
    enabled: Boolean(url),
    refetchInterval: false
  });

  return {
    contentType,
    isLoadingMediaType
  };
};
