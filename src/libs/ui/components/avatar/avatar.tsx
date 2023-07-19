import Identicon from 'react-identicons';
import React from 'react';
import styled, { DefaultTheme, useTheme } from 'styled-components';

import { SpacingSize, AvatarContainer } from '@libs/layout';
import { isValidAccountHash, isValidPublicKey } from '@src/utils';
import { SvgIcon } from '@libs/ui';

const RoundedIdenticon = styled(Identicon)`
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

const IconHashWrapper = styled.div(({ theme }) => ({
  color: theme.color.contentOnFill,
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}));

export const BackgroundWrapper = styled.div(
  ({ size, theme }: { size: number; theme: DefaultTheme }) => ({
    borderRadius: theme.borderRadius.eight,
    height: `${size}px`,
    width: `${size}px`,
    backgroundColor: theme.color.contentTertiary
  })
);

interface AvatarTypes {
  publicKey: string;
  size: number;
  top?: SpacingSize;
}

export const Avatar = ({ publicKey, size, top }: AvatarTypes) => {
  const theme = useTheme();

  if (isValidPublicKey(publicKey)) {
    return (
      <AvatarContainer top={top}>
        <RoundedIdenticon
          string={publicKey.toLowerCase()}
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
