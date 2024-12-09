import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import styled from 'styled-components';

import {
  BorderContainer,
  CenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { useFetchNftTokens } from '@libs/services/nft-service';
import { Skeleton, Tile, Typography } from '@libs/ui/components';

import { NftTokenCard } from './nft-token-card';

const TotalNftValueContainer = styled(SpaceBetweenFlexRow)`
  padding: 12px 16px 12px 0;
`;

const NftListContainer = styled(SpaceBetweenFlexRow)`
  padding: 16px;
  row-gap: 24px;
`;

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const NftList = () => {
  const { t } = useTranslation();

  const {
    nftTokens,
    isNftsLoading,
    hasNftsNextPage,
    fetchNftsNextPage,
    nftTokensCount
  } = useFetchNftTokens();

  const [sentryRef] = useInfiniteScroll({
    loading: isNftsLoading,
    hasNextPage: hasNftsNextPage,
    onLoadMore: fetchNftsNextPage,
    delayInMs: 0
  });

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('nftTokenYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('nftTokenYPosition');
    } else {
      container?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, []);

  const setNftTokenYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'nftTokenYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  return (
    <Tile>
      <BorderContainer marginLeftForSeparatorLine={16}>
        <TotalNftValueContainer>
          <Typography type="body">
            <Trans t={t}>Total amount</Trans>
          </Typography>
          <Typography type="bodySemiBold">{nftTokensCount}</Typography>
        </TotalNftValueContainer>
      </BorderContainer>

      {nftTokens.length > 0 && (
        <NftListContainer wrap="wrap">
          {nftTokens.map(nftToken => (
            <NftTokenCard
              nftToken={nftToken}
              key={nftToken.trackingId}
              onClick={setNftTokenYPosition}
            />
          ))}
        </NftListContainer>
      )}

      {(isNftsLoading || hasNftsNextPage) && (
        <NftListContainer ref={sentryRef}>
          <Skeleton height={145} width={145} />
          <Skeleton height={145} width={145} />
        </NftListContainer>
      )}

      {nftTokens.length === 0 && !isNftsLoading && (
        <VerticalSpaceContainer top={SpacingSize.None}>
          <Container>
            <Typography type="body" color="contentSecondary">
              {nftTokens?.length === 0 && <Trans t={t}>No NFT tokens</Trans>}
            </Typography>
          </Container>
        </VerticalSpaceContainer>
      )}
    </Tile>
  );
};
