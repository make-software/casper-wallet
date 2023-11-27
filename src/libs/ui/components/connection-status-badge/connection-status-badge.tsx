import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { hexToRGBA, Typography } from '@libs/ui';
import { AlignedFlexRow } from '@libs/layout';

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  displayContext: 'accountList' | 'home';
}

const ConnectionStatusBadgeContainer = styled(
  AlignedFlexRow
)<ConnectionStatusBadgeProps>`
  width: fit-content;
  border-radius: ${({ theme }) => theme.borderRadius.ten}px;
  padding: ${({ displayContext }) =>
    displayContext === 'accountList' ? '0' : '2px 8px'};

  color: ${({ theme, isConnected }) =>
    isConnected ? theme.color.contentPositive : theme.color.contentSecondary};

  background-color: ${({ theme, isConnected, displayContext }) =>
    displayContext === 'accountList'
      ? null
      : isConnected
        ? hexToRGBA(theme.color.contentPositive, '.12')
        : theme.color.backgroundSecondary};
`;

export function ConnectionStatusBadge({
  isConnected,
  displayContext
}: ConnectionStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <ConnectionStatusBadgeContainer
      isConnected={isConnected}
      displayContext={displayContext}
    >
      <Typography type="listSubtext">
        {`• ${isConnected ? t('Connected') : t('Not connected')}`}
      </Typography>
    </ConnectionStatusBadgeContainer>
  );
}
