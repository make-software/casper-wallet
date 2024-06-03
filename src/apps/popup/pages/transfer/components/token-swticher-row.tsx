import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  FlexColumn,
  ParagraphContainer,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@libs/layout';
import { SvgIcon, Tile, Typography } from '@libs/ui/components';

const Container = styled(SpaceBetweenFlexRow)`
  padding: 16px;
`;

const RowContainer = styled(FlexColumn)`
  width: 100%;
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
    <RowContainer gap={SpacingSize.Small}>
      <ParagraphContainer top={SpacingSize.XXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>Token</Trans>
        </Typography>
      </ParagraphContainer>

      <Tile>
        <Container gap={SpacingSize.Medium}>
          <AlignedFlexRow gap={SpacingSize.Large} flexGrow={1}>
            <SvgIcon src={iconUrl || ''} size={24} />
            <Typography type="body">{tokenName}</Typography>
          </AlignedFlexRow>
          <Typography type="bodySemiBold" color="contentAction">
            <Trans t={t}>Change</Trans>
          </Typography>
        </Container>
      </Tile>
    </RowContainer>
  );
};
