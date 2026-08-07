import React from 'react';
import styled from 'styled-components';

import { isBundledAssetPath } from '@src/utils';

import { TokenType } from '@hooks/use-casper-token';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { Checkbox, RemoteIcon, SvgIcon, Typography } from '@libs/ui/components';

const Container = styled(AlignedSpaceBetweenFlexRow)`
  padding: 16px;

  cursor: pointer;
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
  return (
    <Container onClick={handleSelect}>
      <AlignedFlexRow gap={SpacingSize.Medium}>
        {token?.icon != null && isBundledAssetPath(token.icon) ? (
          <SvgIcon src={token.icon} alt={token?.name} size={24} />
        ) : (
          <RemoteIcon
            src={token?.icon}
            size={24}
            alt={token?.name}
            title={token?.name}
          />
        )}
        <Typography type="body">{token.name}</Typography>
      </AlignedFlexRow>
      <Checkbox checked={isSelected} />
    </Container>
  );
};
