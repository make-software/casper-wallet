import React from 'react';

import { useFetchWalletBalance } from '@libs/services/balance-service';
import { useFetchCep18Tokens } from '@libs/services/cep18-service';

export const HeaderDataUpdater: React.FC = () => {
  useFetchWalletBalance();
  useFetchCep18Tokens();

  return null;
};
