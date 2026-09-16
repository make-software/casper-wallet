import React from 'react';

import { isBundledAssetPath } from '@src/utils';

// Kept out of content.tsx and imported by path, not through the barrel: that file
// also pulls in redux, react-router and i18n, which a node-environment test can't load.
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

export interface NftTokenDetailIconProps {
  image: string;
  alt?: string;
}

export const NftTokenDetailIcon = ({ image, alt }: NftTokenDetailIconProps) =>
  isBundledAssetPath(image) ? (
    <SvgIcon src={image} size={32} />
  ) : (
    <RemoteIcon src={image} size={32} alt={alt} />
  );
