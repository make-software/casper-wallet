import React from 'react';
import styled from 'styled-components';

import { hexToRGBA, Typography } from '@libs/ui';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
}

const ConnectionStatusBadgeContainer = styled.div<ConnectionStatusBadgeProps>`
  width: fit-content;
  border-radius: 10px;
  padding: 2px 8px;

  color: ${({ theme, isConnected }) =>
    isConnected ? theme.color.contentGreen : theme.color.contentSecondary};

  background-color: ${({ theme, isConnected }) =>
    isConnected
      ? hexToRGBA(theme.color.contentGreen, '.12')
      : theme.color.backgroundSecondary};
`;

export function ConnectionStatusBadge({
  isConnected
}: ConnectionStatusBadgeProps) {
  return (
    <ConnectionStatusBadgeContainer isConnected={isConnected}>
      <Typography type="listSubtext" weight="regular">
        {isConnected ? '• Connected' : '• Disconnected'}
      </Typography>
    </ConnectionStatusBadgeContainer>
  );
}
