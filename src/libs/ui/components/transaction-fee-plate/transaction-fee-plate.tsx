import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { TRANSFER_COST_MOTES } from '@src/constants';

import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

import {
  AlignedSpaceBetweenFlexRow,
  RightAlignedFlexColumn
} from '@libs/layout';
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

  const currencyRate = useSelector(selectAccountCurrencyRate);

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
              currencyRate,
              3
            )}
          </Typography>
        </RightAlignedFlexColumn>
      </TransactionFeeContainer>
    </Tile>
  );
};
