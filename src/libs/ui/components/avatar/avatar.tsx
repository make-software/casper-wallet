import Identicon from 'react-identicons';
import React from 'react';
import styled, { useTheme } from 'styled-components';

import { SpacingSize, AvatarContainer } from '@libs/layout';

const RoundedIdenticon = styled(Identicon)`
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

interface AvatarTypes {
  publicKey: string;
  size?: number;
  top?: SpacingSize;
}

export const Avatar = ({ publicKey, size, top }: AvatarTypes) => {
  const theme = useTheme();

  return (
    <AvatarContainer top={top}>
      <RoundedIdenticon
        string={publicKey.toLowerCase()}
        size={size || 80}
        bg={theme.color.backgroundPrimary}
      />
    </AvatarContainer>
  );
};
