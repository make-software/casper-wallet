import React, { useEffect, useState } from 'react';
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

export const NftPreviewImage = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    let isApiSubscribed = true;

    if (isApiSubscribed) {
      const image = new Image();
      image.src = url;

      image.onload = () => {
        setLoading(false);
      };

      image.onerror = () => {
        // TODO: check this error. It`s happening when we load thumbnail for video
        // index.js:1 Uncaught TypeError: Failed to execute 'readAsDataURL' on 'FileReader': parameter 1 is not of type 'Blob'.
        generateVideoThumbnails(url as any, 1, 'url')
          .then(thumbnail => {
            setThumbnail(thumbnail[0]);
          })
          .catch(error => {
            console.error(error);
            setError(true);
          })
          .finally(() => {
            setLoading(false);
          });
      };
    }

    return () => {
      isApiSubscribed = false;
    };
  }, [url]);

  if (loading && !error) {
    return <LoadingMediaPlaceholder />;
  }

  if (error) {
    return <EmptyMediaPlaceholder />;
  }

  return (
    <ImageContainer>
      <NftImage src={thumbnail || url} />
    </ImageContainer>
  );
};
