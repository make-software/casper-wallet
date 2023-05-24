import React from 'react';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  RightAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui';
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';
import { TokenType } from '@src/hooks';

const NameContainer = styled(AlignedFlexRow)`
  flex-grow: 1;
`;

const ListItemContainer = styled(AlignedSpaceBetweenFlexRow)<{
  chevron?: boolean;
  clickable?: boolean;
}>`
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  padding: ${({ chevron }) => (chevron ? '10px 12px 10px 16px' : '10px 16px')};
`;

interface TokenPlateProps {
  token: TokenType | null;
  chevron?: boolean;
  handleOnClick?: () => void;
}

export const TokenPlate = ({
  token,
  chevron,
  handleOnClick
}: TokenPlateProps) => (
  <ListItemContainer
    chevron={chevron}
    gap={SpacingSize.Small}
    onClick={handleOnClick}
    clickable={!!handleOnClick}
  >
    <NameContainer gap={SpacingSize.Medium}>
      <SvgIcon src={token?.icon || ''} size={32} />
      <Typography type="body">{token?.name}</Typography>
    </NameContainer>
    <RightAlignedFlexColumn>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <Typography type="bodyHash">
          {token?.amountMotes == null
            ? '-'
            : formatNumber(motesToCSPR(token.amountMotes))}
        </Typography>
        <Typography type="bodyHash" color="contentSecondary">
          {token?.symbol}
        </Typography>
      </AlignedFlexRow>
      <Typography type="listSubtext" color="contentSecondary">
        {token?.amountFiat}
      </Typography>
    </RightAlignedFlexColumn>
    {chevron && <SvgIcon src="assets/icons/chevron.svg" size={16} />}
  </ListItemContainer>
);
