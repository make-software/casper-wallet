import { SWAP_PROTOCOL_FEE } from 'casper-wallet-core/src/domain/constants/config';
import { IDexToken } from 'casper-wallet-core/src/domain/swap';
import { ISwapDependencies } from 'casper-wallet-core/src/react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  BorderBottomPseudoElementProps,
  FlexColumn,
  SpacingSize,
  VerticalSpaceContainer,
  borderBottomPseudoElementRules
} from '@libs/layout';
import {
  Hash,
  HashVariant,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui/components';

import {
  formatProtocolFeePercent,
  isHighPriceImpact
} from '../swap-details-utils';
import { SwapBanner } from './swap-banner';
import { SwapRouteRow } from './swap-route-row';

const RowsContainer = styled(FlexColumn)<BorderBottomPseudoElementProps>`
  & > *:not(:last-child) {
    ${borderBottomPseudoElementRules};
  }

  & > *:last-child {
    padding-left: ${({ marginLeftForSeparatorLine }) =>
      marginLeftForSeparatorLine}px;
  }
`;

const Row = styled(AlignedSpaceBetweenFlexRow)`
  padding: 12px 16px 12px 0;
`;

export interface SwapDetailsProps extends Pick<
  ISwapDependencies,
  'network' | 'swapRepository'
> {
  /** `null` before a quote exists — the whole block, label included, is not rendered (D5). */
  quote: string | null;
  priceImpact: string | null;
  protocolFee: string | null;
  networkCost: string | null;
  maxSlippage: string;
  path: string[];
  tokens: IDexToken[];
  /** Package hash of the unlisted selected token, or `null` when neither token is unlisted. */
  unlistedTokenPackageHash: string | null;
}

export const SwapDetails = ({
  network,
  swapRepository,
  quote,
  priceImpact,
  protocolFee,
  networkCost,
  maxSlippage,
  path,
  tokens,
  unlistedTokenPackageHash
}: SwapDetailsProps) => {
  const { t } = useTranslation();

  if (quote == null) {
    return null;
  }

  return (
    <VerticalSpaceContainer top={SpacingSize.Large}>
      <Typography type="bodySemiBold">
        <Trans t={t}>Swap details</Trans>
      </Typography>

      {isHighPriceImpact(priceImpact) && (
        <VerticalSpaceContainer top={SpacingSize.Small}>
          <SwapBanner
            variant="warning"
            icon="assets/icons/error.svg"
            title={t('Very high price impact (-{{value}}%)', {
              value: priceImpact
            })}
          />
        </VerticalSpaceContainer>
      )}

      <VerticalSpaceContainer top={SpacingSize.Small}>
        <Tile borderRadius="base">
          <RowsContainer marginLeftForSeparatorLine={16}>
            {unlistedTokenPackageHash != null && (
              <Row>
                <AlignedFlexRow gap={SpacingSize.Small}>
                  <SvgIcon
                    src="assets/icons/info.svg"
                    color="contentWarning"
                    size={24}
                  />
                  <Typography type="body" color="contentSecondary">
                    <Trans t={t}>Contract hash</Trans>
                  </Typography>
                </AlignedFlexRow>
                <Hash
                  value={unlistedTokenPackageHash}
                  variant={HashVariant.CaptionHash}
                  truncated
                  color="contentWarning"
                  placement="topLeft"
                />
              </Row>
            )}
            <Row>
              <Typography type="body" color="contentSecondary">
                <Trans t={t}>Rate</Trans>
              </Typography>
              <Typography type="captionRegular" color="contentPrimary">
                {quote}
              </Typography>
            </Row>
            <Row>
              <Typography type="body" color="contentSecondary">
                {t('Fee ({{percent}}%)', {
                  percent: formatProtocolFeePercent(SWAP_PROTOCOL_FEE)
                })}
              </Typography>
              <Typography type="captionRegular" color="contentPrimary">
                {protocolFee}
              </Typography>
            </Row>
            <Row>
              <Typography type="body" color="contentSecondary">
                <Trans t={t}>Network Cost</Trans>
              </Typography>
              <Typography type="captionRegular" color="contentPrimary">
                {networkCost}
              </Typography>
            </Row>
            <SwapRouteRow
              network={network}
              swapRepository={swapRepository}
              path={path}
              tokens={tokens}
              networkCost={networkCost}
            />
            <Row>
              <Typography type="body" color="contentSecondary">
                <Trans t={t}>Max Slippage</Trans>
              </Typography>
              <Typography type="captionRegular" color="contentPrimary">
                {`${maxSlippage}%`}
              </Typography>
            </Row>
          </RowsContainer>
        </Tile>
      </VerticalSpaceContainer>
    </VerticalSpaceContainer>
  );
};
