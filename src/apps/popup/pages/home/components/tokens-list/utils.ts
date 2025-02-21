import { TokenDto } from 'casper-wallet-core/src/data/dto';

import { TokenType } from '@hooks/use-casper-token';

export const formatCep18Tokens = (
  cep18Tokens: TokenDto[] | undefined
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
      amountFiat: null,
      icon: token.iconUrl || 'assets/icons/cep18-contract-icon.svg'
    }))
    .sort((a, b) => {
      const first = a.amount.split(',').join('');
      const second = b.amount.split(',').join('');

      return Number(second) - Number(first);
    });
};
