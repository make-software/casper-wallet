import React from 'react';
import styled from 'styled-components';

import { TokenType } from '@hooks/use-casper-token';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { Checkbox, SvgIcon, Typography } from '@libs/ui/components';

const Container = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px;

  cursor: pointer;
`;

const LogoImg = styled.img`
  width: 24px;
  height: 24px;

  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
`;

interface TokenRowProps {
  handleSelect: (e: React.MouseEvent<Element, MouseEvent>) => void;
  isSelected: boolean;
  token: TokenType;
}

export const TokenRow = ({
  handleSelect,
  isSelected,
  token
}: TokenRowProps) => {
  const tokenIconFormat = token?.icon?.split('.').pop();
  const isTokenIconJPG = tokenIconFormat === 'jpg';

  return (
    <Container onClick={handleSelect}>
      <AlignedFlexRow gap={SpacingSize.Medium}>
        {isTokenIconJPG ? (
          <LogoImg
            src={token?.icon || ''}
            alt={token?.name}
            title={token?.name}
          />
        ) : (
          <SvgIcon src={token?.icon || ''} alt={token?.name} size={24} />
        )}
        <Typography type="body">{token.name}</Typography>
      </AlignedFlexRow>
      <Checkbox checked={isSelected} />
    </Container>
  );
};
