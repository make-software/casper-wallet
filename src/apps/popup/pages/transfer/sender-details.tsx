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
import { Avatar, Tile, Typography } from '@libs/ui';
import { truncateKey } from '@libs/ui/components/hash/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { formatNumber, motesToCSPR } from '@src/libs/ui/utils/formatters';

export const AmountContainer = styled(SpaceBetweenFlexColumn)`
  align-items: flex-end;
`;

export const Container = styled(TileContainer)`
  margin-top: 8px;
`;

export const SenderDetails = () => {
  const { t } = useTranslation();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const { balance } = useActiveAccountBalance();

  if (!activeAccount) {
    return null;
  }

  return (
    <>
      <ParagraphContainer top={SpacingSize.XXL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>From</Trans>
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
                <Typography type="captionHash">
                  {truncateKey(activeAccount.publicKey)}
                </Typography>
              </SpaceBetweenFlexColumn>
            </AlignedFlexRow>
            <AmountContainer>
              <Typography type="captionHash">
                {balance.amountMotes == null
                  ? '-'
                  : formatNumber(motesToCSPR(balance.amountMotes), {
                      precision: { max: 5 }
                    })}
              </Typography>
              <Typography type="captionHash">CSPR</Typography>
            </AmountContainer>
          </SpaceBetweenFlexRow>
        </Container>
      </Tile>
    </>
  );
};
