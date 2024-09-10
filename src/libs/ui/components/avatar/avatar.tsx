import { Maybe } from 'casper-wallet-core/src/typings/common';
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
  isAccountSwitcherOpen?: boolean;
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
    stroke: ${({ isDarkMode, displayContext, theme, isAccountSwitcherOpen }) =>
      displayContext === 'header'
        ? isAccountSwitcherOpen
          ? isDarkMode
            ? '#930C16'
            : '#BA0F1C'
          : isDarkMode
            ? '#A30D18'
            : '#CF111F'
        : theme.color.backgroundPrimary};
  }
`;

interface AvatarTypes {
  publicKey: Maybe<string>;
  size: number;
  top?: SpacingSize;
  withConnectedStatus?: boolean;
  isConnected?: boolean;
  displayContext?: 'header' | 'accountList';
  isActiveAccount?: boolean;
  borderRadius?: number;
  brandingLogo?: Maybe<string> | undefined;
  isAccountSwitcherOpen?: boolean;
}

interface ConnectionStatusBadgeTypes {
  children: React.ReactNode;
  connectIcon: string;
  isConnected: boolean;
  displayContext?: 'header' | 'accountList';
  isDarkMode: boolean;
  isAccountSwitcherOpen?: boolean;
}

interface LogoTypes {
  size: number;
  brandingLogo: string;
  publicKey: Maybe<string>;
}

const LogoImg = styled.img<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
`;

const ConnectionStatusBadge = ({
  children,
  connectIcon,
  displayContext,
  isConnected,
  isDarkMode,
  isAccountSwitcherOpen
}: ConnectionStatusBadgeTypes) => {
  return (
    <ConnectionStatusBadgeContainer>
      {children}
      <ConnectIcon
        src={connectIcon}
        size={displayContext === 'header' ? 14 : 12}
        isDarkMode={isDarkMode}
        displayContext={displayContext}
        color={isConnected ? 'contentPositive' : 'contentDisabled'}
        isAccountSwitcherOpen={isAccountSwitcherOpen}
      />
    </ConnectionStatusBadgeContainer>
  );
};

const Logo = ({ size, brandingLogo, publicKey }: LogoTypes) =>
  brandingLogo.endsWith('.svg') ? (
    <SvgIcon src={brandingLogo || ''} alt={publicKey || ''} size={size} />
  ) : (
    <LogoImg
      src={brandingLogo}
      size={size}
      alt={publicKey || ''}
      title={publicKey || ''}
    />
  );

export const Avatar = ({
  publicKey,
  size,
  top,
  withConnectedStatus,
  isConnected,
  displayContext,
  isActiveAccount,
  borderRadius,
  brandingLogo,
  isAccountSwitcherOpen
}: AvatarTypes) => {
  const theme = useTheme();

  const isDarkMode = useIsDarkMode();

  const connectIcon =
    displayContext === 'header'
      ? 'assets/icons/connected-big.svg'
      : 'assets/icons/connected.svg';

  if (withConnectedStatus && isConnected !== undefined) {
    return (
      <ConnectionStatusBadge
        isConnected={isConnected}
        displayContext={displayContext}
        connectIcon={connectIcon}
        isDarkMode={isDarkMode}
        isAccountSwitcherOpen={isAccountSwitcherOpen}
      >
        {brandingLogo ? (
          <Logo size={size} brandingLogo={brandingLogo} publicKey={publicKey} />
        ) : (
          <Identicon
            // in the case of public key is with uppercase characters
            value={publicKey?.toLowerCase() || ''}
            size={size}
            background={theme.color.contentOnFill}
            displayContext={displayContext}
            isActiveAccount={isActiveAccount}
            isConnected={isConnected}
            borderRadius={borderRadius}
          />
        )}
      </ConnectionStatusBadge>
    );
  }

  if (brandingLogo) {
    return (
      <Logo size={size} brandingLogo={brandingLogo} publicKey={publicKey} />
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
