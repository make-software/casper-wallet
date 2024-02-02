import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectAccountBalance } from '@background/redux/account-info/selectors';

import { FlexRow, SpacingSize } from '@libs/layout';
import { ContentColor, getColorFromTheme, motesToCSPR } from '@libs/ui/utils';

const Container = styled(FlexRow)`
  height: 6px;
`;

const Filled = styled.div<{ filledWidth: number; color: ContentColor }>`
  display: ${({ filledWidth }) => (filledWidth === 0 ? 'none' : 'block')};
  height: 6px;
  width: ${({ filledWidth }) => filledWidth}%;
  background-color: ${({ theme, color }) => getColorFromTheme(theme, color)};
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

function calculateLiquidPercentage(
  amountMotes: string | null,
  fullBalanceMotes: string | null
) {
  if (amountMotes != null && fullBalanceMotes != null) {
    const current = Number(motesToCSPR(amountMotes));
    const total = Number(motesToCSPR(fullBalanceMotes));

    return (current / total) * 100;
  }

  return 0;
}

export const AmountBar = () => {
  const balance = useSelector(selectAccountBalance);

  const liquidPercentage = useMemo(
    () =>
      calculateLiquidPercentage(balance.liquidMotes, balance.totalBalanceMotes),
    [balance.liquidMotes, balance.totalBalanceMotes]
  );
  const delegatedPercentage = useMemo(
    () =>
      calculateLiquidPercentage(
        balance.delegatedMotes,
        balance.totalBalanceMotes
      ),
    [balance.delegatedMotes, balance.totalBalanceMotes]
  );
  const undelegatingPercentage = useMemo(
    () =>
      calculateLiquidPercentage(
        balance.undelegatingMotes,
        balance.totalBalanceMotes
      ),
    [balance.undelegatingMotes, balance.totalBalanceMotes]
  );

  return (
    <Container gap={SpacingSize.Tiny}>
      <Filled filledWidth={liquidPercentage} color="contentPositive" />
      <Filled filledWidth={delegatedPercentage} color="contentLightBlue" />
      <Filled filledWidth={undelegatingPercentage} color="contentWarning" />
    </Container>
  );
};
