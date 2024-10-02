import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { TRANSFER_COST_MOTES } from '@src/constants';

import {
  AlignedSpaceBetweenFlexRow,
  RightAlignedFlexColumn
} from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { Tile, Typography } from '@libs/ui/components';
import { formatFiatAmount, formatNumber, motesToCSPR } from '@libs/ui/utils';

const TransactionFeeContainer = styled(AlignedSpaceBetweenFlexRow)`
  padding: 10px 16px;
`;

interface TransactionFeePlateProps {
  paymentAmount: string;
}

export const TransactionFeePlate = ({
  paymentAmount
}: TransactionFeePlateProps) => {
  const { t } = useTranslation();

  const { currencyRate } = useFetchWalletBalance();

  return (
    <Tile>
      <TransactionFeeContainer>
        <Typography type="captionRegular">
          <Trans t={t}>Transaction fee</Trans>
        </Typography>
        <RightAlignedFlexColumn>
          <Typography type="bodyHash">
            {formatNumber(paymentAmount, {
              precision: { max: 5 }
            })}{' '}
            CSPR
          </Typography>
          <Typography type="listSubtext">
            {formatFiatAmount(
              motesToCSPR(TRANSFER_COST_MOTES) || '0',
              currencyRate?.rate || null,
              3
            )}
          </Typography>
        </RightAlignedFlexColumn>
      </TransactionFeeContainer>
    </Tile>
  );
};
