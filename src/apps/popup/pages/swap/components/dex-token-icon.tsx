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

/**
 * Logo of a token in the swap flow.
 *
 * The url comes from the trade API and points at whatever host the token's own
 * team runs, so an icon that 404s or 502s is a normal state, not an anomaly —
 * hence the bundled fallback, without which the row loses its leading slot and
 * the text jumps left.
 */
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
