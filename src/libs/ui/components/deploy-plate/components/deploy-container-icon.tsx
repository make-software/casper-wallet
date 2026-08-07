import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { DeployIcon } from '@src/constants';
import { isBundledAssetPath } from '@src/utils';

// Imported by path, not through the '@libs/ui/components' barrel, and kept in
// its own module rather than inline in deploy-container.tsx: that file also
// pulls in '@libs/layout', whose header re-export chain touches
// webextension-polyfill at module load — fine at runtime (an extension
// context), but it means deploy-container.tsx can't be imported standalone by
// a node-environment test. This routing branch is small enough to be worth
// testing on its own.
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

export interface DeployContainerIconProps {
  iconUrl: string;
  title: Maybe<string>;
}

/** Routes a deploy's icon: bundled paths are inlined, everything else is a plain img. */
export const DeployContainerIcon = ({
  iconUrl,
  title
}: DeployContainerIconProps) =>
  isBundledAssetPath(iconUrl) ? (
    <SvgIcon src={iconUrl} alt={title || ''} size={24} />
  ) : (
    <RemoteIcon
      src={iconUrl}
      size={24}
      alt={title}
      title={title}
      fallbackSrc={DeployIcon.Generic}
    />
  );
