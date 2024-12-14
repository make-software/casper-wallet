import React, { useMemo } from 'react';
import styled from 'styled-components';

import { FlexRow, SpacingSize } from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
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
  amountMotes: string | undefined,
  fullBalanceMotes: string | undefined
) {
  if (amountMotes != null && fullBalanceMotes != null) {
    const current = Number(motesToCSPR(amountMotes));
    const total = Number(motesToCSPR(fullBalanceMotes));

    return (current / total) * 100;
  }

  return 0;
}

export const AmountBar = () => {
  const { accountBalance } = useFetchWalletBalance();

  const liquidPercentage = useMemo(
    () =>
      calculateLiquidPercentage(
        accountBalance.liquidBalance,
        accountBalance.totalBalance
      ),
    [accountBalance.liquidBalance, accountBalance.totalBalance]
  );
  const delegatedPercentage = useMemo(
    () =>
      calculateLiquidPercentage(
        accountBalance.delegatedBalance,
        accountBalance.totalBalance
      ),
    [accountBalance.delegatedBalance, accountBalance.totalBalance]
  );
  const undelegatingPercentage = useMemo(
    () =>
      calculateLiquidPercentage(
        accountBalance.undelegatingBalance,
        accountBalance.totalBalance
      ),
    [accountBalance.undelegatingBalance, accountBalance.totalBalance]
  );

  return (
    <Container gap={SpacingSize.Tiny}>
      <Filled filledWidth={liquidPercentage} color="contentPositive" />
      <Filled filledWidth={delegatedPercentage} color="contentLightBlue" />
      <Filled filledWidth={undelegatingPercentage} color="contentWarning" />
    </Container>
  );
};
