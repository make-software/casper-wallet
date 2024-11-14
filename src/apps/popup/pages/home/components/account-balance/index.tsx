import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { FlexColumn, FlexRow, SpacingSize } from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { Typography, getFontSizeBasedOnTextLength } from '@libs/ui/components';

import { AmountBar } from './amount-bar';
import { AmountRow } from './amount-row';

const AmountRows = styled(FlexColumn)`
  cursor: pointer;
`;

export const AccountBalance = () => {
  const [showFiatAmounts, setShowFiatAmounts] = useState(false);
  const { t } = useTranslation();

  const { accountBalance } = useFetchWalletBalance();

  return (
    <FlexColumn gap={SpacingSize.Large}>
      <FlexColumn>
        <Typography
          type="captionRegular"
          color="contentSecondary"
          loading={!accountBalance.totalFormattedFiatBalance}
        >
          <Trans t={t}>Total balance · </Trans>
          {accountBalance.totalFormattedFiatBalance}
        </Typography>
        <FlexRow gap={SpacingSize.Small}>
          <Typography
            type="CSPRBold"
            fontSize={getFontSizeBasedOnTextLength(
              accountBalance?.totalBalance?.length || 1
            )}
            loading={!accountBalance?.totalFormattedDecimalBalance}
          >
            {accountBalance?.totalFormattedDecimalBalance}
          </Typography>
          <Typography
            type="CSPRLight"
            color="contentSecondary"
            fontSize={getFontSizeBasedOnTextLength(
              accountBalance?.totalBalance?.length || 1
            )}
          >
            CSPR
          </Typography>
        </FlexRow>
      </FlexColumn>
      <FlexColumn gap={SpacingSize.Medium}>
        <AmountBar />
        <AmountRows
          onClick={() =>
            setShowFiatAmounts(showFiatAmounts => !showFiatAmounts)
          }
        >
          <AmountRow
            text="Liquid"
            fiatAmount={accountBalance?.liquidFormattedFiatBalance}
            amountFormattedDecimalBalance={
              accountBalance?.liquidFormattedDecimalBalance
            }
            color="contentPositive"
            showFiatAmounts={showFiatAmounts}
          />
          <AmountRow
            text="Delegated"
            fiatAmount={accountBalance?.delegatedFormattedFiatBalance}
            amountFormattedDecimalBalance={
              accountBalance?.delegatedFormattedDecimalBalance
            }
            color="contentLightBlue"
            showFiatAmounts={showFiatAmounts}
          />
          {accountBalance?.undelegatingBalance &&
            accountBalance?.undelegatingBalance !== '0' && (
              <AmountRow
                text="Undelegating"
                fiatAmount={accountBalance?.undelegatedFormattedFiatBalance}
                amountFormattedDecimalBalance={
                  accountBalance?.undelegatingFormattedDecimalBalance
                }
                color="contentWarning"
                showFiatAmounts={showFiatAmounts}
              />
            )}
        </AmountRows>
      </FlexColumn>
    </FlexColumn>
  );
};
