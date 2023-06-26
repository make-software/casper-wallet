import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';
import { selectAccountBalance } from '@background/redux/account-info/selectors';

export type TokenType = {
  id: string;
  contractHash?: string;
  name: string;
  amount: string;
  amountFiat: string | null;
  symbol: string;
  decimals?: number;
  balance?: string;
  icon: string;
};

export const useCasperToken = () => {
  const [casperToken, setCasperToken] = useState<TokenType | null>(null);

  const balance = useSelector(selectAccountBalance);

  const amount =
    balance?.amountMotes == null
      ? '-'
      : formatNumber(motesToCSPR(balance.amountMotes));

  useEffect(() => {
    setCasperToken({
      id: 'Casper',
      contractHash: undefined,
      name: 'Casper',
      amount,
      amountFiat: balance.amountFiat,
      symbol: 'CSPR',
      icon: '/assets/illustrations/casper.svg'
    });
  }, [amount, balance]);

  return casperToken;
};
