import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountBalance } from '@background/redux/account-info/selectors';

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

  const balance = useSelector(selectAccountBalance);

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
