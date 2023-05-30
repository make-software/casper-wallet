import React from 'react';
import styled from 'styled-components';

import { Tooltip, Typography } from '@libs/ui';
import { AlignedSpaceBetweenFlexRow, SpacingSize } from '@libs/layout';

const SiteFaviconAndHostnameContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 4px 12px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

const FaviconImg = styled.img`
  width: 24px;
  height: 24px;
`;

export function getFaviconUrlFromOrigin(origin: string) {
  if (!/https?:\/\//.test(origin)) {
    return null;
  }

  return `${origin}/favicon.ico`;
}

interface SiteFaviconBadgeProps {
  origin: string | null;
}

export function SiteFaviconBadge({ origin }: SiteFaviconBadgeProps) {
  if (origin === null) {
    return null;
  }

  const faviconUrl = getFaviconUrlFromOrigin(origin);
  const hostName = origin.split('://')[1];

  // TODO: load default favicon when url incorrect
  if (faviconUrl === null) {
    return null;
  }

  return (
    <Tooltip title={hostName} placement="bottomCenter">
      <SiteFaviconAndHostnameContainer gap={SpacingSize.Small}>
        <FaviconImg src={faviconUrl} alt={`${hostName} favicon`} />
        {hostName && (
          <Typography type="body" ellipsis>
            {hostName}
          </Typography>
        )}
      </SiteFaviconAndHostnameContainer>
    </Tooltip>
  );
}
