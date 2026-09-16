import React from 'react';

import { DeployIcon } from '@src/constants';
import { isBundledAssetPath } from '@src/utils';

// Deep paths, not the '@libs/ui/components' barrel — see token-selector-row.tsx.
import { RemoteIcon } from '@libs/ui/components/remote-icon/remote-icon';
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

export interface DexTokenIconProps {
  icon: string | null;
  symbol: string;
  /** Tooltip text; the symbol stands in where the caller has no full name. */
  name?: string;
  size?: number;
}

/** The url is whatever host the token's own team runs, so falling back is a normal path. */
export const DexTokenIcon = ({
  icon,
  symbol,
  name,
  size = 32
}: DexTokenIconProps) =>
  icon != null && isBundledAssetPath(icon) ? (
    <SvgIcon src={icon} alt={symbol} size={size} />
  ) : (
    <RemoteIcon
      src={icon}
      size={size}
      alt={symbol}
      title={name ?? symbol}
      fallbackSrc={DeployIcon.Cep18Default}
      borderRadius={100}
    />
  );
