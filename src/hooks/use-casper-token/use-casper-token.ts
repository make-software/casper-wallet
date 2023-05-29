import { useEffect, useState } from 'react';

import { useActiveAccountBalance } from '@src/hooks';

export type TokenType = {
  id: number;
  name: string;
  amountMotes: string | null;
  amountFiat: string | null;
  symbol: string;
  icon: string;
};

export const useCasperToken = () => {
  const [casperToken, setCasperToken] = useState<TokenType | null>(null);

  const { balance } = useActiveAccountBalance();

  useEffect(() => {
    setCasperToken({
      id: 1,
      name: 'Casper',
      amountMotes: balance.amountMotes,
      amountFiat: balance.amountFiat,
      symbol: 'CSPR',
      icon: '/assets/illustrations/casper.svg'
    });
  }, [balance]);

  return casperToken;
};
