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
  border-radius: 100px;
`;

const FaviconImg = styled.img`
  width: 24px;
  height: 24px;
`;

interface CurrentSiteFaviconProps {
  faviconUrl: string;
  hostName: string;
}

export function CurrentSiteFavicon({
  faviconUrl,
  hostName
}: CurrentSiteFaviconProps) {
  // TODO: load default favicon when url incorrect
  if (!/https:\/\//.test(faviconUrl)) {
    return null;
  }

  return (
    <SiteFaviconAndHostnameContainer>
      <FaviconImg src={faviconUrl} alt={`${hostName} favicon`} />
      {hostName && (
        <Typography type="body" weight="regular">
          {hostName}
        </Typography>
      )}
    </SiteFaviconAndHostnameContainer>
  );
}
