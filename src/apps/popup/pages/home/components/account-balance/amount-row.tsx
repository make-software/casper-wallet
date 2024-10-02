import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { AlignedSpaceBetweenFlexRow, FlexRow, SpacingSize } from '@libs/layout';
import { Typography } from '@libs/ui/components';
import { ContentColor } from '@libs/ui/utils';

interface AmountRowProps {
  text: string;
  fiatAmount: string | undefined;
  amountFormattedDecimalBalance: string | undefined;
  color: ContentColor;
  showFiatAmounts: boolean;
}
export const AmountRow = ({
  text,
  fiatAmount,
  amountFormattedDecimalBalance,
  color,
  showFiatAmounts
}: AmountRowProps) => {
  const { t } = useTranslation();

  return (
    <AlignedSpaceBetweenFlexRow>
      <Typography type="captionRegular" color={color}>
        <Trans t={t}>{text}</Trans>
      </Typography>
      {showFiatAmounts ? (
        <Typography type="captionHash" loading={!fiatAmount}>
          {fiatAmount}
        </Typography>
      ) : (
        <FlexRow gap={SpacingSize.Small}>
          <Typography
            type="captionHash"
            loading={!amountFormattedDecimalBalance}
          >
            {amountFormattedDecimalBalance}
          </Typography>
          <Typography type="captionHash" color="contentSecondary">
            CSPR
          </Typography>
        </FlexRow>
      )}
    </AlignedSpaceBetweenFlexRow>
  );
};
