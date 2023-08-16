import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

import { useInfinityScroll, useNftTokens } from '@src/hooks';
import { Tile, Typography } from '@libs/ui';
import {
  BorderContainer,
  CenteredFlexRow,
  FlexRow,
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

const NftListContainer = styled(FlexRow)`
  padding: 16px;

  row-gap: 24px;
  column-gap: 16px;
`;

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const NftList = () => {
  const { t } = useTranslation();

  const { loadMoreNftTokens } = useNftTokens();
  const { observerElement } = useInfinityScroll(loadMoreNftTokens);

  const nftTokens = useSelector(selectAccountNftTokens);
  const nftTokensCount = useSelector(selectAccountNftTokensCount);

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

      {nftTokens.length === 0 && (
        <VerticalSpaceContainer top={SpacingSize.None}>
          <Container>
            <Typography type="body" color="contentSecondary">
              {nftTokens?.length === 0 && <Trans t={t}>No NFT tokens</Trans>}
            </Typography>
          </Container>
        </VerticalSpaceContainer>
      )}

      {nftTokens.length > 0 && (
        <NftListContainer wrap="wrap">
          {nftTokens.map((nftToken, index) => {
            if (index === nftTokens.length - 1 && nftTokens.length >= 10) {
              return (
                <NftTokenCard
                  nftToken={nftToken}
                  key={nftToken.tracking_id}
                  ref={observerElement}
                />
              );
            }

            return (
              <NftTokenCard nftToken={nftToken} key={nftToken.tracking_id} />
            );
          })}
        </NftListContainer>
      )}
    </Tile>
  );
};
