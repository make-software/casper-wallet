import { Maybe } from 'casper-wallet-core/src/typings/common';
import React from 'react';

import { DeployIcon } from '@src/constants';
import { isBundledAssetPath } from '@src/utils';

// By path, and in its own module: both other routes reach webextension-polyfill at module load.
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
