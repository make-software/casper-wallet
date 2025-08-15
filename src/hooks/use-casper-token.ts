import { SupportedMarketDataProviders } from 'casper-wallet-core';
import { useEffect, useState } from 'react';

import { useFetchWalletBalance } from '@libs/services/balance-service';

// TODO: review this in future and maybe remove and use type from casper wallet core
export type TokenType = {
  id: string;
  contractPackageHash?: string;
  name: string;
  amount: string;
  amountFiat: string | null;
  amountFiatDecimal?: string | null;
  tokenPrice?: string | null;
  tokenPriceProvider?: SupportedMarketDataProviders | null;
  tokenPriceProviderUrl?: string | null;
  symbol: string;
  decimals?: number;
  balance?: string;
  icon: string | null;
};

export const useCasperToken = () => {
  const [casperToken, setCasperToken] = useState<TokenType | null>(null);

  const { accountBalance, currencyRate } = useFetchWalletBalance();

  useEffect(() => {
    setCasperToken({
      id: 'Casper',
      contractPackageHash: undefined,
      name: 'Casper',
      amount: accountBalance.liquidFormattedDecimalBalance || '-',
      amountFiat: accountBalance.liquidFormattedFiatBalance,
      amountFiatDecimal: accountBalance.liquidFiatBalance,
      tokenPrice: currencyRate?.rate?.toString(),
      tokenPriceProvider: 'CoinGecko',
      tokenPriceProviderUrl:
        'https://www.coingecko.com/en/coins/casper-network',
      symbol: 'CSPR',
      icon: '/assets/icons/casper.svg'
    });
  }, [
    accountBalance.liquidFormattedDecimalBalance,
    accountBalance.liquidFormattedFiatBalance
  ]);

  return casperToken;
};
