import React from 'react';
import { useFetchActiveAccountBalance, useFetchErc20Tokens } from '@src/hooks';

export const HeaderDataUpdater: React.FC = () => {
  useFetchActiveAccountBalance();
  useFetchErc20Tokens();

  return null;
};
