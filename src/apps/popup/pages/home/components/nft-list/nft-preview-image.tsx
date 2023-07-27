import React, { useState } from 'react';

import { EmptyMediaPlaceholder, ImageContainer } from './nft-media-placeholder';

export const NftPreviewImage = ({ url }: { url: string }) => {
  const [error, setError] = useState(false);

  const onErrorHandler = (): void => {
    setError(true);
  };

  if (error) {
    return <EmptyMediaPlaceholder />;
  }

  return (
    <ImageContainer>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `url("${url}") center no-repeat`,
          backgroundSize: `cover`,
          borderRadius: '8px'
        }}
        onError={onErrorHandler}
      />
    </ImageContainer>
  );
};
