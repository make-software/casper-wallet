import { useEffect, useState } from 'react';

import { useFetchWalletBalance } from '@libs/services/balance-service';

export type TokenType = {
  id: string;
  contractHash?: string;
  name: string;
  amount: string;
  amountFiat: string | null;
  symbol: string;
  decimals?: number;
  balance?: string;
  icon: string | null;
};

export const useCasperToken = () => {
  const [casperToken, setCasperToken] = useState<TokenType | null>(null);

  const { accountBalance } = useFetchWalletBalance();

  useEffect(() => {
    setCasperToken({
      id: 'Casper',
      contractHash: undefined,
      name: 'Casper',
      amount: accountBalance.liquidFormattedDecimalBalance || '-',
      amountFiat: accountBalance.liquidFormattedFiatBalance,
      symbol: 'CSPR',
      icon: '/assets/icons/casper.svg'
    });
  }, [
    accountBalance.liquidFormattedDecimalBalance,
    accountBalance.liquidFormattedFiatBalance
  ]);

  return casperToken;
};
