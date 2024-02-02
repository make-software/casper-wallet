import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectAccountCurrencyRate } from '@background/redux/account-info/selectors';

import { AlignedSpaceBetweenFlexRow, FlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';
import {
  ContentColor,
  formatCurrency,
  formatNumber,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils';

interface AmountRowProps {
  text: string;
  amountMotes: string | null;
  color: ContentColor;
  showFiatAmounts: boolean;
}
export const AmountRow = ({
  text,
  amountMotes,
  color,
  showFiatAmounts
}: AmountRowProps) => {
  const { t } = useTranslation();

  const currencyRate = useSelector(selectAccountCurrencyRate);

  const fiatAmount =
    currencyRate != null && amountMotes != null
      ? formatCurrency(
          motesToCurrency(String(amountMotes), currencyRate),
          'USD',
          {
            precision: 2
          }
        )
      : '';

  return (
    <AlignedSpaceBetweenFlexRow>
      <Typography type="captionRegular" color={color}>
        <Trans t={t}>{text}</Trans>
      </Typography>
      {showFiatAmounts ? (
        <Typography type="captionHash">{fiatAmount}</Typography>
      ) : (
        <FlexRow gap={SpacingSize.Small}>
          <Typography type="captionHash">
            {amountMotes == null
              ? '-'
              : formatNumber(motesToCSPR(amountMotes), {
                  precision: { max: 5 }
                })}
          </Typography>
          <Typography type="captionHash" color="contentSecondary">
            CSPR
          </Typography>
        </FlexRow>
      )}
    </AlignedSpaceBetweenFlexRow>
  );
};
