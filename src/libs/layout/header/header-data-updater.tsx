import React from 'react';

import { useFetchErc20Tokens } from '@hooks/use-fetch-erc20-tokens';

import { useFetchWalletBalance } from '@libs/services/balance-service';

export const HeaderDataUpdater: React.FC = () => {
  useFetchErc20Tokens();
  useFetchWalletBalance();

  return null;
};
