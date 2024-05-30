import React from 'react';
import styled from 'styled-components';

import { TokenType } from '@hooks/use-casper-token';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  RightAlignedCenteredFlexRow,
  RightAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Tooltip, Typography } from '@libs/ui/components';

const TokenAmountContainer = styled(RightAlignedFlexColumn)`
  max-width: 120px;
`;

const TokenNameContainer = styled.div`
  max-width: 100px;
`;

const ListItemContainer = styled(AlignedSpaceBetweenFlexRow)<{
  chevron?: boolean;
  clickable?: boolean;
}>`
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  padding: ${({ chevron }) => (chevron ? '10px 12px 10px 16px' : '10px 16px')};
`;

const LogoImg = styled.img`
  width: 32px;
  height: 32px;
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
}: TokenPlateProps) => {
  const tokenIconFormat = token?.icon?.split('.').pop();
  const isTokenIconJPG = tokenIconFormat === 'jpg';
  const isTokenIconPNG = tokenIconFormat === 'png';

  return (
    <ListItemContainer
      chevron={chevron}
      gap={SpacingSize.Small}
      onClick={handleOnClick}
      clickable={!!handleOnClick}
    >
      <AlignedFlexRow gap={SpacingSize.Medium}>
        {isTokenIconJPG || isTokenIconPNG ? (
          <LogoImg
            src={token?.icon || ''}
            alt={token?.name}
            title={token?.name}
          />
        ) : (
          <SvgIcon src={token?.icon || ''} alt={token?.name} size={32} />
        )}
        <TokenNameContainer>
          <Tooltip
            title={
              token?.name && token.name.length > 10 ? token.name : undefined
            }
            fullWidth
            overflowWrap
          >
            <Typography type="body" ellipsis loading={!token?.name}>
              {token?.name}
            </Typography>
          </Tooltip>
        </TokenNameContainer>
      </AlignedFlexRow>
      <AlignedFlexRow gap={SpacingSize.Small}>
        <TokenAmountContainer>
          <Tooltip
            title={
              (token?.amount && token.amount.length > 7) ||
              (token?.symbol && token.symbol.length > 6)
                ? `${token?.amount} ${token?.symbol}`
                : undefined
            }
            placement="bottomLeft"
            overflowWrap
            fullWidth
          >
            <RightAlignedCenteredFlexRow gap={SpacingSize.Small}>
              <Typography type="bodyHash" ellipsis loading={!token?.amount}>
                {token?.amount}
              </Typography>
              <Typography
                type="bodyHash"
                color="contentSecondary"
                ellipsis={!!(token?.symbol && token.symbol.length > 6)}
                loading={!token?.symbol && token?.symbol !== ''}
              >
                {token?.symbol}
              </Typography>
            </RightAlignedCenteredFlexRow>
          </Tooltip>
          {token?.name === 'Casper' && (
            <Typography
              type="listSubtext"
              color="contentSecondary"
              loading={!token?.amountFiat}
            >
              {token?.amountFiat}
            </Typography>
          )}
        </TokenAmountContainer>
        {chevron && <SvgIcon src="assets/icons/chevron.svg" size={16} />}
      </AlignedFlexRow>
    </ListItemContainer>
  );
};
