import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAccountBalance } from '@background/redux/account-info/selectors';

import { FlexColumn, FlexRow, SpacingSize } from '@libs/layout';
import { Typography, getFontSizeBasedOnTextLength } from '@libs/ui/components';
import { formatNumber, motesToCSPR } from '@libs/ui/utils';

import { AmountBar } from './amount-bar';
import { AmountRow } from './amount-row';

const AmountRows = styled(FlexColumn)`
  cursor: pointer;
`;

export const AccountBalance = () => {
  const [showFiatAmounts, setShowFiatAmounts] = useState(false);
  const { t } = useTranslation();

  const balance = useSelector(selectAccountBalance);

  return (
    <FlexColumn gap={SpacingSize.Large}>
      <FlexColumn>
        <Typography
          type="captionRegular"
          color="contentSecondary"
          loading={!balance.totalBalanceFiat}
        >
          <Trans t={t}>Total balance · </Trans>
          {balance.totalBalanceFiat}
        </Typography>
        <FlexRow gap={SpacingSize.Small}>
          <Typography
            type="CSPRBold"
            fontSize={getFontSizeBasedOnTextLength(
              balance.totalBalanceMotes?.length || 1
            )}
            loading={!balance.totalBalanceMotes}
          >
            {balance.totalBalanceMotes == null
              ? '-'
              : formatNumber(motesToCSPR(balance.totalBalanceMotes), {
                  precision: { max: 5 }
                })}
          </Typography>
          <Typography
            type="CSPRLight"
            color="contentSecondary"
            fontSize={getFontSizeBasedOnTextLength(
              balance.totalBalanceMotes?.length || 1
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
            amountMotes={balance.liquidMotes}
            color="contentPositive"
            showFiatAmounts={showFiatAmounts}
          />
          <AmountRow
            text="Delegated"
            amountMotes={balance.delegatedMotes}
            color="contentLightBlue"
            showFiatAmounts={showFiatAmounts}
          />
          {balance.undelegatingMotes !== '0' &&
            balance.undelegatingMotes != null && (
              <AmountRow
                text="Undelegating"
                amountMotes={balance.undelegatingMotes}
                color="contentWarning"
                showFiatAmounts={showFiatAmounts}
              />
            )}
        </AmountRows>
      </FlexColumn>
    </FlexColumn>
  );
};
