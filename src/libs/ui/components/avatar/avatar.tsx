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
import { hexToRGBA, SvgIcon } from '@libs/ui';
import { useSelector } from 'react-redux';
import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';
import { useSystemThemeDetector } from '@src/hooks';

const RoundedIdenticon = styled(Identicon)<{
  displayContext?: 'header';
  isDarkMode: boolean;
}>`
  border-radius: ${({ theme, displayContext }) =>
    displayContext ? theme.borderRadius.base : theme.borderRadius.eight}px;
  border: ${({ displayContext, isDarkMode, theme }) =>
    displayContext
      ? isDarkMode
        ? `0.5px solid ${theme.color.contentDisabled}}`
        : `0.5px solid ${hexToRGBA(theme.color.black, '0.16')}`
      : 'none'};
`;

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

  const themeMode = useSelector(selectThemeModeSetting);

  const isSystemDarkTheme = useSystemThemeDetector();

  const isDarkMode =
    themeMode === ThemeMode.SYSTEM
      ? isSystemDarkTheme
      : themeMode === ThemeMode.DARK;

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
        <RoundedIdenticon
          string={publicKey}
          size={size}
          bg={theme.color.contentOnFill}
          displayContext={displayContext}
          isDarkMode={isDarkMode}
        />
        <SvgIcon
          src={connectIcon}
          size={displayContext === 'header' ? 14 : 16}
          style={{
            position: 'absolute',
            bottom: displayContext === 'header' ? '-4px' : '-5px',
            right: displayContext === 'header' ? '-4px' : '-5px'
          }}
          color={isConnected ? 'contentPositive' : 'contentDisabled'}
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
          bg={theme.color.contentOnFill}
          isDarkMode={isDarkMode}
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
