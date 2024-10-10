import { useInfiniteQuery } from '@tanstack/react-query';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { NFT_TOKENS_REFRESH_RATE } from '@src/constants';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { nftsRepository } from '@background/wallet-repositories';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

export const useFetchNftTokens = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const accountHash = getAccountHashFromPublicKey(activeAccount?.publicKey);

  const {
    data: nftsData,
    isLoading: isNftsLoading,
    refetch: refetchNfts,
    fetchNextPage: fetchNftsNextPage,
    hasNextPage: hasNftsNextPage = false
  } = useInfiniteQuery({
    queryKey: ['NFTs', network, accountHash],
    enabled: Boolean(accountHash),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      nftsRepository.getNfts({
        network: network.toLowerCase() as CasperNetwork,
        publicKey: activeAccount?.publicKey ?? '',
        page: pageParam
      }),
    getNextPageParam: (lastPage, pages) => {
      const nextPage = pages.length + 1;

      return nextPage <= lastPage.pageCount ? nextPage : undefined;
    },
    staleTime: NFT_TOKENS_REFRESH_RATE,
    refetchInterval: NFT_TOKENS_REFRESH_RATE
  });

  const flattenedNfts = useMemo(
    () =>
      nftsData?.pages
        ?.flat()
        ?.map(t => t.data)
        ?.flat() ?? [],
    [nftsData?.pages]
  );

  return {
    nftTokens: flattenedNfts,
    nftTokensCount: nftsData?.pages[0].itemCount,
    isNftsLoading,
    refetchNfts,
    fetchNftsNextPage,
    hasNftsNextPage
  };
};
