import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  selectAccountBalance,
  selectAccountCurrencyRate
} from '@background/redux/account-info/selectors';

import {
  formatCurrency,
  formatNumber,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils';

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
  const currencyRate = useSelector(selectAccountCurrencyRate);

  const amount =
    balance?.liquidMotes == null
      ? '-'
      : formatNumber(motesToCSPR(balance.liquidMotes), {
          precision: { max: 5 }
        });
  const amountFiat =
    currencyRate != null && balance?.liquidMotes != null
      ? formatCurrency(
          motesToCurrency(String(balance.liquidMotes), currencyRate),
          'USD',
          {
            precision: 2
          }
        )
      : '';

  useEffect(() => {
    setCasperToken({
      id: 'Casper',
      contractHash: undefined,
      name: 'Casper',
      amount,
      amountFiat: amountFiat,
      symbol: 'CSPR',
      icon: '/assets/icons/casper.svg'
    });
  }, [amount, amountFiat]);

  return casperToken;
};
