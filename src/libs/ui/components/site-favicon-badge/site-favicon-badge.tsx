import React from 'react';
import styled from 'styled-components';

import { Typography } from '@libs/ui';

const SiteFaviconAndHostnameContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  width: fit-content;

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
    <SiteFaviconAndHostnameContainer>
      <FaviconImg src={faviconUrl} alt={`${hostName} favicon`} />
      {hostName && <Typography type="body">{hostName}</Typography>}
    </SiteFaviconAndHostnameContainer>
  );
}
