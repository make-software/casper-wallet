import React from 'react';
import Identicon from 'react-identicons';
import { useSelector } from 'react-redux';
import styled, { DefaultTheme, useTheme } from 'styled-components';

import { isValidAccountHash, isValidPublicKey } from '@src/utils';

import { selectThemeModeSetting } from '@background/redux/settings/selectors';
import { ThemeMode } from '@background/redux/settings/types';

import { useSystemThemeDetector } from '@hooks/use-system-theme-detector';

import {
  AlignedFlexRow,
  AvatarContainer,
  CenteredFlexRow,
  SpacingSize
} from '@libs/layout';
import { SvgIcon } from '@libs/ui';

const RoundedIdenticon = styled(Identicon)(
  ({
    theme,
    displayContext,
    isActiveAccount,
    isConnected
  }: {
    theme: DefaultTheme;
    displayContext?: 'header' | 'accountList';
    isActiveAccount?: boolean;
    isConnected?: boolean;
  }) => ({
    borderRadius: theme.borderRadius.base,

    ...(displayContext === 'accountList' && {
      border: isActiveAccount
        ? `3px solid ${
            isConnected
              ? theme.color.contentPositive
              : theme.color.contentDisabled
          }`
        : `3px solid ${theme.color.backgroundPrimary}`
    })
  })
);

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
  displayContext?: 'header' | 'accountList';
  isActiveAccount?: boolean;
}

export const Avatar = ({
  publicKey,
  size,
  top,
  withConnectedStatus,
  isConnected,
  displayContext,
  isActiveAccount
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
          isActiveAccount={isActiveAccount}
          isConnected={isConnected}
        />
        <SvgIcon
          src={connectIcon}
          size={
            displayContext === 'header' || displayContext === 'accountList'
              ? 12
              : 16
          }
          style={{
            position: 'absolute',
            bottom:
              displayContext === 'header'
                ? '-4px'
                : displayContext === 'accountList'
                  ? '-2px'
                  : '-5px',
            right:
              displayContext === 'header'
                ? '-4px'
                : displayContext === 'accountList'
                  ? '-2px'
                  : '-5px'
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
