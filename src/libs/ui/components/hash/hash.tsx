import React from 'react';
import styled from 'styled-components';

import { ContentColor, SvgIcon, Typography } from '@libs/ui';

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
  CaptionHash = 'caption',
  BodyHash = 'body'
}

interface HashProps {
  value: string;
  variant: HashVariant;
  truncated?: boolean;
  withCopy?: boolean;
  color?: ContentColor;
}

export function Hash({
  value,
  variant,
  withCopy,
  truncated,
  color
}: HashProps) {
  return (
    <HashContainer
      onClick={
        withCopy ? () => navigator.clipboard.writeText(value) : undefined
      }
    >
      <Typography
        asHash
        type={variant}
        weight="regular"
        color={color || 'contentSecondary'}
      >
        {truncated ? truncateKey(value) : value}
      </Typography>
      {withCopy && <SvgIcon src="assets/icons/copy.svg" size={24} />}
    </HashContainer>
  );
}
