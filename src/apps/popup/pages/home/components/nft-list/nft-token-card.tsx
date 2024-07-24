import React, { forwardRef, useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  ContentType,
  deriveMediaType,
  findMediaPreview,
  getImageProxyUrl,
  getMetadataKeyValue,
  getNftTokenMetadataWithLinks
} from '@src/utils';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { useAsyncEffect } from '@hooks/use-async-effect';

import { FlexColumn, SpacingSize } from '@libs/layout';
import { NFTTokenResult } from '@libs/services/nft-service';
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
    nftToken: NFTTokenResult | null;
    onClick?: () => void;
  }
>(({ nftToken, onClick }, ref) => {
  const navigate = useTypedNavigate();
  const [contentType, setContentType] = useState<ContentType>('');
  const [typeLoading, setTypeLoading] = useState<boolean>(true);

  const nftTokenMetadataWithLinks = useMemo(
    () => getNftTokenMetadataWithLinks(nftToken),
    [nftToken]
  );

  const preview = nftTokenMetadataWithLinks?.find(findMediaPreview);

  const metadataKeyValue = useMemo(
    () => getMetadataKeyValue(nftTokenMetadataWithLinks),
    [nftTokenMetadataWithLinks]
  );

  const cachedUrl = getImageProxyUrl(preview?.value);

  useAsyncEffect<string>(
    () => deriveMediaType(cachedUrl),
    mediaType => {
      setContentType(mediaType);
      setTypeLoading(false);
    },
    [cachedUrl]
  );

  return (
    <NftTokenCardContainer
      gap={SpacingSize.Small}
      ref={ref}
      data-testid="nft-token-card"
      onClick={() => {
        navigate(
          RouterPath.NftDetails.replace(
            ':tokenId',
            nftToken?.token_id || ''
          ).replace(
            ':contractPackageHash',
            nftToken?.contract_package_hash || ''
          )
        );

        if (onClick) {
          onClick();
        }
      }}
    >
      {preview ? (
        <>
          {typeLoading && <LoadingMediaPlaceholder />}
          <NftPreviewImage
            url={preview.value}
            cachedUrl={cachedUrl}
            contentType={contentType}
          />
        </>
      ) : (
        <EmptyMediaPlaceholder />
      )}
      <Typography type="captionRegular" ellipsis>
        {metadataKeyValue?.name}
      </Typography>
    </NftTokenCardContainer>
  );
});
