import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedSpaceBetweenFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { Tile, Typography } from '@libs/ui/components';

const Row = styled(AlignedSpaceBetweenFlexRow)`
  padding: 12px 16px;
`;

export interface WrapDetailsProps {
  /** The section heading, worded for the mode — see `swapModeLabels`. */
  title: string;
  networkCost: string;
}

/**
 * The wrap arm's counterpart to {@link SwapDetails}. A wrap is 1:1 off-quote, so rate, price
 * impact, protocol fee, route and slippage all have nothing to say — gas is the one cost the
 * user still pays, and it is the whole card.
 */
export const WrapDetails = ({ title, networkCost }: WrapDetailsProps) => {
  const { t } = useTranslation();

  return (
    <VerticalSpaceContainer top={SpacingSize.Large}>
      <Typography type="bodySemiBold">
        <Trans t={t}>{title}</Trans>
      </Typography>

      <VerticalSpaceContainer top={SpacingSize.Small}>
        <Tile borderRadius="base">
          <Row>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>Network Cost</Trans>
            </Typography>
            <Typography type="captionRegular" color="contentPrimary">
              {networkCost}
            </Typography>
          </Row>
        </Tile>
      </VerticalSpaceContainer>
    </VerticalSpaceContainer>
  );
};
