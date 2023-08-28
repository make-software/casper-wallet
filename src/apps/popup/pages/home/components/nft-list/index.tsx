import React, { useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';

import { useInfinityScroll, useFetchNftTokens } from '@src/hooks';
import { Tile, Typography } from '@libs/ui';
import {
  BorderContainer,
  CenteredFlexRow,
  SpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  selectAccountNftTokens,
  selectAccountNftTokensCount
} from '@background/redux/account-info/selectors';

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

  const { loadMoreNftTokens, loading } = useFetchNftTokens();
  const { observerElement } = useInfinityScroll(loadMoreNftTokens);

  const nftTokens = useSelector(selectAccountNftTokens);
  const nftTokensCount = useSelector(selectAccountNftTokensCount);

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('nftTokenYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('nftTokenYPosition');
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
          <Typography
            type="body"
            style={loading ? { width: '100%' } : undefined}
          >
            <Trans t={t}>Total amount</Trans>
          </Typography>
          <Typography type="bodySemiBold" loading={loading}>
            {nftTokensCount}
          </Typography>
        </TotalNftValueContainer>
      </BorderContainer>

      {loading && (
        <VerticalSpaceContainer top={SpacingSize.None}>
          <NftListContainer>
            <Skeleton height={145} width={145} />
            <Skeleton height={145} width={145} />
          </NftListContainer>
        </VerticalSpaceContainer>
      )}

      {nftTokens.length === 0 && !loading && (
        <VerticalSpaceContainer top={SpacingSize.None}>
          <Container>
            <Typography type="body" color="contentSecondary">
              {nftTokens?.length === 0 && <Trans t={t}>No NFT tokens</Trans>}
            </Typography>
          </Container>
        </VerticalSpaceContainer>
      )}

      {nftTokens.length > 0 && !loading && (
        <NftListContainer wrap="wrap">
          {nftTokens.map((nftToken, index) => (
            <NftTokenCard
              nftToken={nftToken}
              key={nftToken.tracking_id}
              ref={
                index === nftTokens.length - 1 && nftTokens.length >= 10
                  ? observerElement
                  : null
              }
              onClick={setNftTokenYPosition}
            />
          ))}
        </NftListContainer>
      )}
    </Tile>
  );
};
