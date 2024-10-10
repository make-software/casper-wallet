import { INft } from 'casper-wallet-core/src/domain';
import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { FlexColumn, SpacingSize } from '@libs/layout';
import { useFetchDeriveMediaType } from '@libs/services/nft-service';
import {
  EmptyMediaPlaceholder,
  LoadingMediaPlaceholder,
  Typography
} from '@libs/ui/components';

import { NftPreviewImage } from './nft-preview-image';

type Ref = HTMLDivElement;

const NftTokenCardContainer = styled(FlexColumn)`
  width: 140px;

  cursor: pointer;
`;

export const NftTokenCard = forwardRef<
  Ref,
  {
    nftToken: INft | null;
    onClick?: () => void;
  }
>(({ nftToken, onClick }, ref) => {
  const navigate = useTypedNavigate();

  const preview = nftToken?.previewUrl;

  const cachedUrl = nftToken?.proxyPreviewUrl;

  const { contentType, isLoadingMediaType } =
    useFetchDeriveMediaType(cachedUrl);

  return (
    <NftTokenCardContainer
      gap={SpacingSize.Small}
      ref={ref}
      data-testid="nft-token-card"
      onClick={() => {
        navigate(
          RouterPath.NftDetails.replace(
            ':tokenId',
            nftToken?.tokenId || ''
          ).replace(':contractPackageHash', nftToken?.contractPackageHash || '')
        );

        if (onClick) {
          onClick();
        }
      }}
    >
      {preview ? (
        <>
          {isLoadingMediaType && <LoadingMediaPlaceholder />}
          <NftPreviewImage
            url={preview}
            cachedUrl={cachedUrl}
            contentType={contentType}
          />
        </>
      ) : (
        <EmptyMediaPlaceholder />
      )}
      <Typography type="captionRegular" ellipsis>
        {nftToken?.metadata?.name}
      </Typography>
    </NftTokenCardContainer>
  );
});
