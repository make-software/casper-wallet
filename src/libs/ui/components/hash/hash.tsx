import React from 'react';
import styled from 'styled-components';

import { SvgIcon, Typography } from '@libs/ui';

import { truncateKey } from './utils';

const HashContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  & > span {
    cursor: ${({ onClick }) => (onClick ? 'pointer' : 'cursor')};
  }
`;

export enum HashVariant {
  CaptionHash = 'caption-hash',
  BodyHash = 'body-hash'
}

interface HashProps {
  hash: string;
  variant: HashVariant;
  truncated?: boolean;
  withCopy?: boolean;
}

export function Hash({ hash, variant, withCopy, truncated }: HashProps) {
  return (
    <HashContainer
      onClick={withCopy ? () => navigator.clipboard.writeText(hash) : undefined}
    >
      <Typography type={variant} weight="regular" color="contentSecondary">
        {truncated ? truncateKey(hash) : hash}
      </Typography>
      {withCopy && <SvgIcon src="assets/icons/copy.svg" size={24} />}
    </HashContainer>
  );
}
