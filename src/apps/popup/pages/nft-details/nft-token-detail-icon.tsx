import React from 'react';

import { isBundledAssetPath } from '@src/utils';

// Imported by path, not through the '@libs/ui/components' barrel, and kept in
// its own module rather than inline in content.tsx: that file also pulls in
// '@libs/layout', redux, react-router and i18n, which a node-environment test
// can't load or render standalone. This routing branch is small enough to be
// worth testing on its own.
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

export interface NftTokenDetailIconProps {
  image: string;
  alt?: string;
}

/** Routes a token-details row icon: bundled paths are inlined, everything else is a plain img. */
export const NftTokenDetailIcon = ({ image, alt }: NftTokenDetailIconProps) =>
  isBundledAssetPath(image) ? (
    <SvgIcon src={image} size={32} />
  ) : (
    <RemoteIcon src={image} size={32} alt={alt} />
  );
