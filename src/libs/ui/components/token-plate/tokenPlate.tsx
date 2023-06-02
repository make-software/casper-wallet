import React from 'react';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  RightAlignedCenteredFlexRow,
  RightAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Tooltip, Typography } from '@libs/ui';
import { TokenType } from '@src/hooks';

const NameContainer = styled(AlignedFlexRow)`
  flex-grow: 1;

  max-width: 148px;
`;

const TokenAmountContainer = styled(RightAlignedFlexColumn)`
  width: 120px;
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
    <TokenAmountContainer>
      <Tooltip
        title={
          token?.amount && token.amount.length > 7 ? token?.amount : undefined
        }
        placement="topLeft"
        overflowWrap
        fullWidth
      >
        <RightAlignedCenteredFlexRow gap={SpacingSize.Small}>
          <Typography type="bodyHash" ellipsis>
            {token?.amount}
          </Typography>
          <Typography type="bodyHash" color="contentSecondary">
            {token?.symbol}
          </Typography>
        </RightAlignedCenteredFlexRow>
      </Tooltip>
      <Typography type="listSubtext" color="contentSecondary">
        {token?.amountFiat}
      </Typography>
    </TokenAmountContainer>
    {chevron && <SvgIcon src="assets/icons/chevron.svg" size={16} />}
  </ListItemContainer>
);
