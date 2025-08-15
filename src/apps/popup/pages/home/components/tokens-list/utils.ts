import { ITokenWithFiatBalance } from 'casper-wallet-core';

import { TokenType } from '@hooks/use-casper-token';

export const formatCep18Tokens = (
  cep18Tokens: ITokenWithFiatBalance[] | undefined
): TokenType[] | undefined => {
  return cep18Tokens
    ?.map<TokenType>(token => ({
      id: token.contractPackageHash,
      contractPackageHash: token.contractPackageHash,
      name: token.name,
      balance: token.balance,
      amount: token.formattedDecimalBalance,
      symbol: token.symbol,
      decimals: token.decimals,
      amountFiat: token.formattedFiatBalance,
      amountFiatDecimal: token.fiatBalance,
      tokenPrice: token.fiatPrice?.toString(),
      tokenPriceProvider: token.marketDataProvider,
      tokenPriceProviderUrl: token.marketDataProviderUrl,
      icon: token.iconUrl || 'assets/icons/cep18-contract-icon.svg'
    }))
    .sort((a, b) => {
      const first = a.amount.split(',').join('');
      const second = b.amount.split(',').join('');

      return Number(second) - Number(first);
    });
};
