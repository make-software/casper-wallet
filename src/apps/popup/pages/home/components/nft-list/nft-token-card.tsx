import React, { forwardRef, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { NFTTokenResult } from '@libs/services/nft-service';
import { FlexColumn, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui';

import { NftPreviewImage } from './nft-preview-image';
import {
  EmptyMediaPlaceholder,
  LoadingMediaPlaceholder
} from './nft-media-placeholder';
import {
  deriveMediaType,
  findMediaPreview,
  getImageProxyUrl,
  getMetadataKeyValue,
  getNftTokenMetadataWithLinks
} from './utils';

type Ref = HTMLDivElement;

const NftTokenCardContainer = styled(FlexColumn)`
  max-width: 140px;
`;

export const NftTokenCard = forwardRef<
  Ref,
  {
    nftToken: NFTTokenResult | null;
  }
>(({ nftToken }, ref) => {
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const RETINA_SCALE = 2;
  const IMAGE_WIDTH = 376;
  const CACHE_TTL = '2592000';

  const nftTokenMetadataWithLinks = useMemo(
    () => getNftTokenMetadataWithLinks(nftToken),
    [nftToken]
  );

  const preview = nftTokenMetadataWithLinks?.find(findMediaPreview);

  const metadataKeyValue = useMemo(
    () => getMetadataKeyValue(nftTokenMetadataWithLinks),
    [nftTokenMetadataWithLinks]
  );

  const cachedUrl = getImageProxyUrl(preview?.value, {
    ttl: CACHE_TTL,
    width: IMAGE_WIDTH * RETINA_SCALE
  });

  useEffect(() => {
    setLoading(true);
    deriveMediaType(cachedUrl)
      .then(media => setMediaType(media.type))
      .finally(() => setLoading(false));
  }, [cachedUrl]);

  if (loading) {
    return (
      <NftTokenCardContainer gap={SpacingSize.Small} ref={ref}>
        <LoadingMediaPlaceholder />
        <Typography type="captionRegular" ellipsis>
          {metadataKeyValue?.name}
        </Typography>
      </NftTokenCardContainer>
    );
  }

  if (preview && mediaType) {
    if (mediaType.includes('image')) {
      return (
        <NftTokenCardContainer gap={SpacingSize.Small} ref={ref}>
          <NftPreviewImage url={cachedUrl || ''} />
          <Typography type="captionRegular" ellipsis>
            {metadataKeyValue?.name}
          </Typography>
        </NftTokenCardContainer>
      );
    }
  }

  return (
    <NftTokenCardContainer gap={SpacingSize.Small} ref={ref}>
      <EmptyMediaPlaceholder />
      <Typography type="captionRegular" ellipsis>
        {metadataKeyValue?.name}
      </Typography>
    </NftTokenCardContainer>
  );
});
