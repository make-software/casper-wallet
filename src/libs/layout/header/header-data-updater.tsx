import React from 'react';

import { useFetchAccountsBalance } from '@hooks/use-fetch-accounts-balance';
import { useFetchActiveAccountBalance } from '@hooks/use-fetch-active-account-balance';
import { useFetchErc20Tokens } from '@hooks/use-fetch-erc20-tokens';

export const HeaderDataUpdater: React.FC = () => {
  useFetchActiveAccountBalance();
  useFetchErc20Tokens();
  useFetchAccountsBalance();

  return null;
};
