import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { ContentType } from '@src/utils';

import {
  AudioNftPlaceholder,
  EmptyMediaPlaceholder,
  ImageContainer,
  LoadingMediaPlaceholder,
  VideoNftPlaceholder
} from '@libs/ui/components';

const NftImage = styled.img`
  width: 100%;
  height: 100%;

  object-fit: cover;
  object-position: center;

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

export const NftPreviewImage = ({
  url,
  cachedUrl,
  contentType
}: {
  url: string;
  contentType: ContentType;
  cachedUrl?: string;
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  const onLoad = useCallback(() => {
    setLoading(false);
  }, []);

  if (error) {
    return <EmptyMediaPlaceholder />;
  }

  return (
    <>
      {contentType.startsWith('image') && (
        <ImageContainer>
          <NftImage
            style={{ display: loading ? 'none' : 'inline-block' }}
            src={cachedUrl || url}
            onLoad={onLoad}
            onError={onError}
          />
          {loading && <LoadingMediaPlaceholder />}
        </ImageContainer>
      )}
      {contentType.startsWith('audio') && <AudioNftPlaceholder />}
      {contentType.startsWith('video') && <VideoNftPlaceholder />}
      {contentType === 'unknown' && <EmptyMediaPlaceholder />}
    </>
  );
};
