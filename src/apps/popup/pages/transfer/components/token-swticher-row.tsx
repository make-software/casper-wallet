import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { AlignedFlexRow, SpaceBetweenFlexRow, SpacingSize } from '@libs/layout';
import { SvgIcon, Tile, Typography } from '@libs/ui/components';

const Container = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

interface TokenSwitcherRowProps {
  tokenName: string | undefined;
  iconUrl: string | null | undefined;
}

export const TokenSwitcherRow = ({
  iconUrl,
  tokenName
}: TokenSwitcherRowProps) => {
  const { t } = useTranslation();

  return (
    <Tile style={{ marginTop: '8px' }}>
      <Container gap={SpacingSize.Medium}>
        <AlignedFlexRow gap={SpacingSize.Large} flexGrow={1}>
          <SvgIcon src={iconUrl || ''} size={24} />
          <Typography dataTestId="token-row" type="body">
            {tokenName}
          </Typography>
        </AlignedFlexRow>
        <Typography type="bodySemiBold" color="contentAction">
          <Trans t={t}>Change</Trans>
        </Typography>
      </Container>
    </Tile>
  );
};
