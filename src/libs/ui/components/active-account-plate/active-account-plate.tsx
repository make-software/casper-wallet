import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  AlignedFlexRow,
  ParagraphContainer,
  SpaceBetweenFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  TileContainer
} from '@libs/layout';
import { Avatar, Hash, HashVariant, Tile, Typography } from '@libs/ui';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

export const AmountContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-end;
`;

export const Container = styled(TileContainer)`
  margin-top: 8px;
`;

interface ActiveAccountPlateProps {
  label: string;
  balance: string | null;
  symbol: string | null;
}

export const ActiveAccountPlate = ({
  label,
  symbol,
  balance
}: ActiveAccountPlateProps) => {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);

  if (!activeAccount) {
    return null;
  }

  return (
    <>
      <ParagraphContainer top={SpacingSize.XXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>{label}</Trans>
        </Typography>
      </ParagraphContainer>
      <Tile>
        <Container paddingVertical={SpacingSize.Small}>
          <SpaceBetweenFlexRow>
            <AlignedFlexRow gap={SpacingSize.Medium}>
              <Avatar publicKey={activeAccount.publicKey} size={24} />
              <SpaceBetweenFlexColumn>
                <Typography type="captionMedium">
                  {activeAccount.name}
                </Typography>
                <Hash
                  value={activeAccount.publicKey}
                  variant={HashVariant.CaptionHash}
                  color="contentSecondary"
                  truncated
                  placement="bottomRight"
                />
              </SpaceBetweenFlexColumn>
            </AlignedFlexRow>
            <AmountContainer>
              <Typography type="captionHash">
                {balance == null ? '-' : balance}
              </Typography>
              <Typography type="captionHash" color="contentSecondary">
                {symbol || '-'}
              </Typography>
            </AmountContainer>
          </SpaceBetweenFlexRow>
        </Container>
      </Tile>
    </>
  );
};
