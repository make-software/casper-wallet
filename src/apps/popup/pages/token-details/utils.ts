import { ITokenWithFiatBalance } from 'casper-wallet-core';

import { formatCep18Tokens } from '@popup/pages/home/components/tokens-list/utils';

import { TokenType } from '@hooks/use-casper-token';

export const getTokenData = (
  initialTokenData: TokenType | null,
  cep18Tokens: ITokenWithFiatBalance[],
  casperToken: TokenType | null,
  tokenName?: string
) => {
  if (tokenName === 'Casper') {
    return casperToken;
  } else {
    // CEP-18 token case
    const formatedCep18Tokens = formatCep18Tokens(cep18Tokens);

    const token = formatedCep18Tokens?.find(token => token.id === tokenName);

    if (token) {
      return token;
    } else {
      return initialTokenData ? { ...initialTokenData, amount: '0' } : null;
    }
  }
};
