import Identicon from 'react-identicons';
import React from 'react';
import styled, { css, useTheme } from 'styled-components';

import { CenteredFlexColumn } from '@libs/layout';

const fullWidthAndMarginTop = css`
  margin-top: 16px;
  width: 100%;
`;

const AvatarContainer = styled(CenteredFlexColumn)`
  ${fullWidthAndMarginTop};
`;

const RoundedIdenticon = styled(Identicon)`
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
`;

interface AvatarTypes {
  publicKey: string;
}

export const Avatar = ({ publicKey }: AvatarTypes) => {
  const theme = useTheme();

  return (
    <AvatarContainer>
      <RoundedIdenticon
        string={publicKey.toLowerCase()}
        size={120}
        bg={theme.color.backgroundPrimary}
      />
    </AvatarContainer>
  );
};
