import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import {
  AlignedFlexRow,
  ParagraphContainer,
  SpaceBetweenFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  TileContainer
} from '@libs/layout';
import {
  Avatar,
  Hash,
  HashVariant,
  Tile,
  Tooltip,
  Typography
} from '@libs/ui/components';

export const AmountContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-end;

  max-width: 120px;
`;

const NameContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-start;

  max-width: 120px;
`;

const Container = styled(TileContainer)`
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
              <NameContainer>
                <Tooltip
                  title={activeAccount.name}
                  placement="topLeft"
                  overflowWrap
                  fullWidth
                >
                  <Typography type="captionMedium" ellipsis>
                    {activeAccount.name}
                  </Typography>
                </Tooltip>
                <Hash
                  value={activeAccount.publicKey}
                  variant={HashVariant.CaptionHash}
                  color="contentSecondary"
                  truncated
                  placement="bottomRight"
                />
              </NameContainer>
            </AlignedFlexRow>
            <AmountContainer>
              <Tooltip
                title={
                  balance != null && balance.length > 9 ? balance : undefined
                }
                placement="topLeft"
                overflowWrap
                fullWidth
              >
                <Typography type="captionHash" ellipsis>
                  {balance == null ? '-' : balance}
                </Typography>
              </Tooltip>
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
