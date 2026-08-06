import React from 'react';
import styled from 'styled-components';

import { hasHttpPrefix } from '@src/utils';

import { TokenType } from '@hooks/use-casper-token';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize,
  getSpacingSize
} from '@libs/layout';
import { RemoteIcon, SvgIcon, Tooltip, Typography } from '@libs/ui/components';
import { truncateKey } from '@libs/ui/components/hash/utils';

const TokenAmountContainer = styled(FlexColumn)`
  max-width: 300px;
`;

const TokenNameContainer = styled.div`
  max-width: 200px;
`;

const ListItemContainer = styled(AlignedSpaceBetweenFlexRow)<{
  chevron?: boolean;
  clickable?: boolean;
}>`
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  padding: ${({ chevron }) => (chevron ? '10px 12px 10px 16px' : '10px 16px')};
`;

const TokenDetailsContainer = styled(AlignedFlexRow)`
  column-gap: ${getSpacingSize(SpacingSize.Tiny)};
  row-gap: ${getSpacingSize(SpacingSize.None)};
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
  const nameTooltipTitle = token?.contractPackageHash ? (
    <FlexColumn gap={SpacingSize.Tiny}>
      <Typography type="captionRegular" overflowWrap>
        {token.name}
      </Typography>
      <Typography type="captionHash" color="contentSecondary">
        {truncateKey(token.contractPackageHash, { size: 'base' })}
      </Typography>
    </FlexColumn>
  ) : token?.name && token.name.length > 10 ? (
    token.name
  ) : undefined;

  return (
    <ListItemContainer
      chevron={chevron}
      gap={SpacingSize.Small}
      onClick={handleOnClick}
      clickable={!!handleOnClick}
    >
      <AlignedFlexRow gap={SpacingSize.Medium}>
        {token?.icon && !hasHttpPrefix(token.icon) ? (
          <SvgIcon src={token.icon} alt={token?.name} size={32} />
        ) : (
          <RemoteIcon
            src={token?.icon}
            size={32}
            alt={token?.name}
            title={token?.name}
          />
        )}
        <FlexColumn>
          <TokenNameContainer>
            <Tooltip title={nameTooltipTitle} fullWidth overflowWrap>
              <Typography type="bodySemiBold" ellipsis loading={!token?.name}>
                {token?.name}
              </Typography>
            </Tooltip>
          </TokenNameContainer>

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
              <TokenDetailsContainer wrap="wrap">
                <Typography
                  type="captionHash"
                  ellipsis
                  loading={!token?.amount}
                >
                  {token?.amount}
                </Typography>

                <Typography
                  type="captionHash"
                  color="contentSecondary"
                  ellipsis={!!(token?.symbol && token.symbol.length > 6)}
                  loading={!token?.symbol && token?.symbol !== ''}
                >
                  {token?.symbol}
                </Typography>

                {(token?.name === 'Casper' || token?.amountFiat) && (
                  <Typography
                    type="captionRegular"
                    color="contentSecondary"
                    loading={!token?.amountFiat}
                  >
                    ({token?.amountFiat})
                  </Typography>
                )}
              </TokenDetailsContainer>
            </Tooltip>
          </TokenAmountContainer>
        </FlexColumn>
      </AlignedFlexRow>
      <AlignedFlexRow>
        {chevron && <SvgIcon src="assets/icons/chevron.svg" size={16} />}
      </AlignedFlexRow>
    </ListItemContainer>
  );
};
