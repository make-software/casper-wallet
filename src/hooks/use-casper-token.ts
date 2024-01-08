import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountBalance } from '@background/redux/account-info/selectors';

import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';

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

  const balance = useSelector(selectAccountBalance);

  const amount =
    balance?.amountMotes == null
      ? '-'
      : formatNumber(motesToCSPR(balance.amountMotes), {
          precision: { max: 5 }
        });

  useEffect(() => {
    setCasperToken({
      id: 'Casper',
      contractHash: undefined,
      name: 'Casper',
      amount,
      amountFiat: balance.amountFiat,
      symbol: 'CSPR',
      icon: '/assets/icons/casper.svg'
    });
  }, [amount, balance]);

  return casperToken;
};
