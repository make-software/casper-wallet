import React from 'react';
import { useActiveAccountBalance, useErc20Tokens } from '@src/hooks';

export const HeaderDataUpdater: React.FC = () => {
  useActiveAccountBalance();
  useErc20Tokens();

  return null;
};
