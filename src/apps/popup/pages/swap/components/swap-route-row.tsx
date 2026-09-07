import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import {
  ISwapDependencies,
  useSwapRouteTokens
} from 'casper-wallet-core/src/react';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  FlexColumn,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Typography } from '@libs/ui/components';

import { DexTokenIcon } from './dex-token-icon';

export interface SwapRouteRowProps extends Pick<
  ISwapDependencies,
  'network' | 'swapRepository'
> {
  path: string[];
  tokens: IDexToken[];
  /** The `Best price route costs {{cost}}` paragraph, shown once expanded. */
  networkCost: string | null;
}

const Container = styled(FlexColumn)`
  padding: 12px 16px 12px 0;
  gap: 8px;

  cursor: pointer;
`;

const HopChainRow = styled(AlignedFlexRow)`
  flex-wrap: wrap;
`;

export const SwapRouteRow = ({
  network,
  swapRepository,
  path,
  tokens,
  networkCost
}: SwapRouteRowProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const hopTokens = useSwapRouteTokens({
    network,
    swapRepository,
    path,
    tokens,
    enabled: isExpanded
  });

  return (
    <Container onClick={() => setIsExpanded(prev => !prev)}>
      <AlignedSpaceBetweenFlexRow>
        <Typography type="body" color="contentSecondary">
          {isExpanded ? (
            <Trans t={t}>Swap Route</Trans>
          ) : (
            <Trans t={t}>Route</Trans>
          )}
        </Typography>
        {!isExpanded && (
          <Typography type="captionRegular" color="contentPrimary">
            {t('CSPR.trade API')}
          </Typography>
        )}
      </AlignedSpaceBetweenFlexRow>

      {isExpanded && (
        <>
          <HopChainRow gap={SpacingSize.Small}>
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
                  size={20}
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
          <Typography type="captionRegular" color="contentSecondary">
            {t(
              'Best price route costs {{cost}}. This route optimises your total output by considering split routes, multiple hops, and the cost of each step.',
              { cost: networkCost ?? '' }
            )}
          </Typography>
        </>
      )}
    </Container>
  );
};
