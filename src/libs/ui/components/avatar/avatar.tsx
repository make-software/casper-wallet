import React from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';

import { isValidAccountHash, isValidPublicKey } from '@src/utils';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import {
  AlignedFlexRow,
  AvatarContainer,
  CenteredFlexRow,
  SpacingSize
} from '@libs/layout';
import { Identicon, SvgIcon } from '@libs/ui/components';

const IconHashWrapper = styled(CenteredFlexRow)(({ theme }) => ({
  color: theme.color.contentOnFill,
  height: '100%'
}));

const ConnectionStatusBadgeContainer = styled(AlignedFlexRow)`
  position: relative;
  z-index: 1;
`;

export const BackgroundWrapper = styled.div(
  ({ size, theme }: { size: number; theme: DefaultTheme }) => ({
    borderRadius: theme.borderRadius.eight,
    height: `${size}px`,
    width: `${size}px`,
    backgroundColor: theme.color.contentDisabled
  })
);

const ConnectIcon = styled(SvgIcon)<{
  displayContext?: 'header' | 'accountList';
  isDarkMode: boolean;
  color: string;
}>`
  position: absolute;
  bottom: ${({ displayContext }) =>
    displayContext === 'header'
      ? '-4px'
      : displayContext === 'accountList'
        ? '-2px'
        : '-5px'};
  right: ${({ displayContext }) =>
    displayContext === 'header'
      ? '-4px'
      : displayContext === 'accountList'
        ? '-2px'
        : '-5px'};
  svg > circle {
    stroke: ${({ isDarkMode, displayContext, theme }) =>
      displayContext === 'header'
        ? isDarkMode
          ? '#A30D18'
          : '#CF111F'
        : theme.color.backgroundPrimary};
  }
`;

interface AvatarTypes {
  publicKey: string;
  size: number;
  top?: SpacingSize;
  withConnectedStatus?: boolean;
  isConnected?: boolean;
  displayContext?: 'header' | 'accountList';
  isActiveAccount?: boolean;
  borderRadius?: number;
}

export const Avatar = ({
  publicKey,
  size,
  top,
  withConnectedStatus,
  isConnected,
  displayContext,
  isActiveAccount,
  borderRadius
}: AvatarTypes) => {
  const theme = useTheme();

  const isDarkMode = useIsDarkMode();

  const connectIcon = isDarkMode
    ? displayContext === 'header'
      ? 'assets/icons/connected-dark.svg'
      : 'assets/icons/connected-dark-big.svg'
    : displayContext === 'header'
      ? 'assets/icons/connected-light.svg'
      : 'assets/icons/connected-light-big.svg';

  if (withConnectedStatus && isConnected !== undefined) {
    return (
      <ConnectionStatusBadgeContainer>
        <Identicon
          // in the case of public key is with uppercase characters
          value={publicKey.toLowerCase()}
          size={size}
          background={theme.color.contentOnFill}
          displayContext={displayContext}
          isActiveAccount={isActiveAccount}
          isConnected={isConnected}
          borderRadius={borderRadius}
        />
        <ConnectIcon
          src={connectIcon}
          size={
            displayContext === 'header' || displayContext === 'accountList'
              ? 12
              : 16
          }
          isDarkMode={isDarkMode}
          displayContext={displayContext}
          color={isConnected ? 'contentPositive' : 'contentDisabled'}
        />
      </ConnectionStatusBadgeContainer>
    );
  }

  if (isValidPublicKey(publicKey)) {
    return (
      <AvatarContainer top={top}>
        <Identicon
          // in the case of public key is with uppercase characters
          value={publicKey.toLowerCase()}
          size={size}
          background={theme.color.contentOnFill}
          borderRadius={borderRadius}
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
