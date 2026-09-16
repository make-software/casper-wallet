import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import {
  ISwapDependencies,
  useSwapRouteTokens
} from 'casper-wallet-core/src/react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

import { shouldStackSwapRoute } from '../swap-details-utils';
import { DexTokenIcon } from './dex-token-icon';

export interface SwapRouteRowProps extends Pick<
  ISwapDependencies,
  'network' | 'swapRepository'
> {
  path: string[];
  tokens: IDexToken[];
  /** Cost quoted in the `Best price route costs {{cost}}` paragraph. */
  networkCost: string | null;
}

const Container = styled(FlexColumn)`
  padding: 12px 16px 12px 0;
  gap: 8px;
`;

const HopChainRow = styled(AlignedFlexRow)<{ $stacked: boolean }>`
  flex-wrap: wrap;
  justify-content: ${({ $stacked }) => ($stacked ? 'flex-start' : 'flex-end')};

  min-width: 0;
`;

export const SwapRouteRow = ({
  network,
  swapRepository,
  path,
  tokens,
  networkCost
}: SwapRouteRowProps) => {
  const { t } = useTranslation();

  const hopTokens = useSwapRouteTokens({
    network,
    swapRepository,
    path,
    tokens
  });

  const isStacked = shouldStackSwapRoute(hopTokens.length);

  const hopChain = (
    <HopChainRow $stacked={isStacked} gap={SpacingSize.Tiny}>
      {hopTokens.map((token, index) => (
        <AlignedFlexRow key={token.id} gap={SpacingSize.Tiny}>
          {index > 0 && (
            <SvgIcon
              src="assets/icons/chevron.svg"
              size={12}
              color="contentSecondary"
            />
          )}
          <DexTokenIcon
            icon={token.icon}
            symbol={token.symbol}
            name={token.name}
            size={16}
          />
          <Typography type="captionRegular">{token.symbol}</Typography>
          {!token.isWhitelisted && !token.isBlacklisted && (
            <SvgIcon
              src="assets/icons/info.svg"
              size={12}
              color="contentWarning"
            />
          )}
        </AlignedFlexRow>
      ))}
    </HopChainRow>
  );

  const label = (
    <Typography type="body" color="contentSecondary" noWrap>
      <Trans t={t}>Swap Route</Trans>
    </Typography>
  );

  return (
    <Container>
      {isStacked ? (
        <>
          {label}
          {hopChain}
        </>
      ) : (
        <AlignedSpaceBetweenFlexRow gap={SpacingSize.Small}>
          {label}
          {hopChain}
        </AlignedSpaceBetweenFlexRow>
      )}

      <Typography type="captionRegular" color="contentSecondary">
        {t(
          'Best price route costs {{cost}}. This route optimises your total output by considering split routes, multiple hops, and the cost of each step.',
          { cost: networkCost ?? '' }
        )}
      </Typography>
    </Container>
  );
};
