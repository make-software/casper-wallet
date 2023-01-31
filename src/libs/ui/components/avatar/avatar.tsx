import Identicon from 'react-identicons';
import React from 'react';
import styled, { css, useTheme } from 'styled-components';
import Skeleton from 'react-loading-skeleton';

import { CenteredFlexColumn } from '@libs/layout';

const fullWidthAndMarginTop = css`
  margin-top: 16px;
  width: 100%;
`;

const AvatarContainer = styled(CenteredFlexColumn)`
  ${fullWidthAndMarginTop};
`;

interface AvatarTypes {
  src?: string;
  publicKey: string;
  loadingAccountInfo: boolean;
}

export const Avatar = ({ src, publicKey, loadingAccountInfo }: AvatarTypes) => {
  const theme = useTheme();

  if (loadingAccountInfo) {
    return (
      <AvatarContainer>
        <Skeleton
          style={{
            width: '100%',
            height: 120,
            marginTop: 0,
            display: 'inline-block'
          }}
        />
      </AvatarContainer>
    );
  }

  if (src) {
    return (
      <div
        style={{
          background: `url("${src}") center no-repeat`,
          backgroundSize: `contain`,
          marginTop: '16px'
        }}
      >
        <div style={{ width: '100%', height: 120 }} />
      </div>
    );
  }

  return (
    <AvatarContainer>
      <Identicon
        string={publicKey.toLowerCase()}
        size={120}
        bg={theme.color.backgroundPrimary}
      />
    </AvatarContainer>
  );
};
