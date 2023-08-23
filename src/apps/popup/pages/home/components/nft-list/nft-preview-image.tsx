import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { generateVideoThumbnails } from '@rajesh896/video-thumbnails-generator';

import {
  EmptyMediaPlaceholder,
  ImageContainer,
  LoadingMediaPlaceholder
} from '@libs/ui';

const NftImage = styled.img`
  width: 100%;
  height: 100%;

  object-fit: cover;
  object-position: center;

  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

export const NftPreviewImage = ({
  url,
  cachedUrl
}: {
  url: string;
  cachedUrl?: string;
}) => {
  const [error, setError] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const onError = useCallback(async () => {
    try {
      // TODO: check this error. It`s happening when we load thumbnail for video
      // index.js:1 Uncaught TypeError: Failed to execute 'readAsDataURL' on 'FileReader': parameter 1 is not of type 'Blob'.
      const thumbnails = await generateVideoThumbnails(
        (cachedUrl || url) as any,
        1,
        'url'
      );
      setThumbnail(thumbnails[0]);
      setLoading(false);
    } catch (e) {
      setError(true);
    }
  }, [cachedUrl, url]);

  if (error) {
    return <EmptyMediaPlaceholder />;
  }

  return (
    <ImageContainer>
      <NftImage
        style={{ display: loading ? 'none' : 'inline-block' }}
        src={thumbnail || cachedUrl || url}
        onLoad={() => {
          setLoading(false);
        }}
        onError={onError}
      />
      {loading && <LoadingMediaPlaceholder />}
    </ImageContainer>
  );
};
