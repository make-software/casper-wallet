import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectAccountNftTokens,
  selectAccountNftTokensCount
} from '@background/redux/account-info/selectors';

import { useFetchNftTokens } from '@hooks/use-fetch-nft-tokens';

import {
  BorderContainer,
  CenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Skeleton, Tile, Typography } from '@libs/ui';

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

  const nftTokens = useSelector(selectAccountNftTokens);
  const nftTokensCount = useSelector(selectAccountNftTokensCount);

  const { loadMoreNftTokens, loading, hasNextPage } = useFetchNftTokens();

  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMoreNftTokens,
    delayInMs: 0
  });

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('nftTokenYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('nftTokenYPosition');
    } else {
      container?.scrollTo(0, 0);
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

      {nftTokens != null && nftTokens.length > 0 && (
        <NftListContainer wrap="wrap">
          {nftTokens.map(nftToken => (
            <NftTokenCard
              nftToken={nftToken}
              key={nftToken.tracking_id}
              onClick={setNftTokenYPosition}
            />
          ))}
        </NftListContainer>
      )}

      {(loading || hasNextPage) && (
        <NftListContainer ref={sentryRef}>
          <Skeleton height={145} width={145} />
          <Skeleton height={145} width={145} />
        </NftListContainer>
      )}

      {(nftTokens == null || nftTokens.length === 0) && !loading && (
        <VerticalSpaceContainer top={SpacingSize.None}>
          <Container>
            <Typography type="body" color="contentSecondary">
              {nftTokens?.length === 0 && <Trans t={t}>No NFT tokens</Trans>}
              {nftTokens == null && <Trans t={t}>Something went wrong</Trans>}
            </Typography>
          </Container>
        </VerticalSpaceContainer>
      )}
    </Tile>
  );
};
