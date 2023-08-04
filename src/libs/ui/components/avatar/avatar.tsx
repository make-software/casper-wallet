import Identicon from 'react-identicons';
import React from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';

import {
  SpacingSize,
  AvatarContainer,
  AlignedFlexRow,
  CenteredFlexRow
} from '@libs/layout';
import { isValidAccountHash, isValidPublicKey } from '@src/utils';
import { SvgIcon } from '@libs/ui';

const RoundedIdenticon = styled(Identicon)<{ displayContext?: 'header' }>`
  border-radius: ${({ theme, displayContext }) =>
    displayContext ? theme.borderRadius.base : theme.borderRadius.eight}px;
  border: ${({ displayContext, theme }) =>
    displayContext ? `0.5px solid #1A191929` : 'none'};
`;

const IconHashWrapper = styled(CenteredFlexRow)(({ theme }) => ({
  color: theme.color.contentOnFill,
  height: '100%'
}));

const ConnectionStatusBadgeContainer = styled(AlignedFlexRow)`
  position: relative;
`;

export const BackgroundWrapper = styled.div(
  ({ size, theme }: { size: number; theme: DefaultTheme }) => ({
    borderRadius: theme.borderRadius.eight,
    height: `${size}px`,
    width: `${size}px`,
    backgroundColor: theme.color.contentTertiary
  })
);

const ConnectionStatusBadge = styled.div<{
  isConnected: boolean;
  displayContext?: 'header';
}>`
  width: ${({ displayContext }) => (displayContext ? '14px' : '16px')};
  height: ${({ displayContext }) => (displayContext ? '14px' : '16px')};
  border-radius: 50%;

  background-color: ${({ theme, displayContext }) =>
    displayContext ? theme.color.backgroundRed : theme.color.backgroundPrimary};

  position: absolute;
  bottom: -4px;
  right: -4px;

  &:after {
    content: '';
    width: ${({ displayContext }) => (displayContext ? '8px' : '10px')};
    height: ${({ displayContext }) => (displayContext ? '8px' : '10px')};
    border-radius: 50%;

    background-color: ${({ isConnected, theme }) =>
      isConnected ? theme.color.contentGreen : theme.color.contentTertiary};

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }
`;

interface AvatarTypes {
  publicKey: string;
  size: number;
  top?: SpacingSize;
  withConnectedStatus?: boolean;
  isConnected?: boolean;
  displayContext?: 'header';
}

export const Avatar = ({
  publicKey,
  size,
  top,
  withConnectedStatus,
  isConnected,
  displayContext
}: AvatarTypes) => {
  const theme = useTheme();

  if (withConnectedStatus && isConnected !== undefined) {
    return (
      <ConnectionStatusBadgeContainer>
        <RoundedIdenticon
          string={publicKey}
          size={size}
          bg={theme.color.backgroundPrimary}
          displayContext={displayContext}
        />
        <ConnectionStatusBadge
          isConnected={isConnected}
          displayContext={displayContext}
        />
      </ConnectionStatusBadgeContainer>
    );
  }

  if (isValidPublicKey(publicKey)) {
    return (
      <AvatarContainer top={top}>
        <RoundedIdenticon
          string={publicKey}
          size={size}
          bg={theme.color.backgroundPrimary}
        />
      </AvatarContainer>
    );
  }

  if (isValidAccountHash(publicKey)) {
    return (
      <BackgroundWrapper size={size}>
        <IconHashWrapper>
          <SvgIcon src="assets/icons/hash.svg" size={size - 8} />
        </IconHashWrapper>
      </BackgroundWrapper>
    );
  }

  return null;
};
