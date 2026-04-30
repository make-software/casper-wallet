import React from 'react';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { SvgIcon, Tile, Typography } from '@libs/ui/components';

interface HighStakeWarningProps {
  networkShare: string;
}

const Content = styled(FlexColumn)`
  padding: 12px 16px;
  gap: 8px;
`;

export const HighStakeWarning = ({ networkShare }: HighStakeWarningProps) => {
  const formatted = Number(networkShare).toFixed(2);

  return (
    <Tile borderRadius="base">
      <Content>
        <AlignedFlexRow gap={SpacingSize.Tiny}>
          <SvgIcon
            src="assets/icons/error.svg"
            color="contentWarning"
            size={24}
          />
          <Typography type="bodySemiBold">Important</Typography>
        </AlignedFlexRow>
        <Typography type="captionRegular" color="contentSecondary">
          This validator controls {formatted}% of the voting power and belongs
          to a high&#8209;stake group. Elevated stake concentration may affect
          decentralization and reduce overall network resilience.
        </Typography>
      </Content>
    </Tile>
  );
};
