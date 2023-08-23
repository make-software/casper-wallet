import React, { forwardRef, useMemo } from 'react';
import styled from 'styled-components';

import { NFTTokenResult } from '@libs/services/nft-service';
import { FlexColumn, SpacingSize } from '@libs/layout';
import { Typography, EmptyMediaPlaceholder } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  findMediaPreview,
  getMetadataKeyValue,
  getNftTokenMetadataWithLinks,
  getImageProxyUrl
} from '@src/utils';

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
  }
>(({ nftToken }, ref) => {
  const navigate = useTypedNavigate();

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

  return (
    <NftTokenCardContainer
      gap={SpacingSize.Small}
      ref={ref}
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
      }}
    >
      {preview ? (
        <NftPreviewImage url={preview.value} cachedUrl={cachedUrl} />
      ) : (
        <EmptyMediaPlaceholder />
      )}
      <Typography type="captionRegular" ellipsis>
        {metadataKeyValue?.name}
      </Typography>
    </NftTokenCardContainer>
  );
});
