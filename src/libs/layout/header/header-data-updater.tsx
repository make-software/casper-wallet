import React from 'react';
import {
  useActiveAccountBalance,
  useErc20Tokens,
  useFetchAccountActivity,
  useNftTokens
} from '@src/hooks';
import { ActivityListTransactionsType } from '@src/constants';

export const HeaderDataUpdater: React.FC = () => {
  useActiveAccountBalance();
  useFetchAccountActivity(ActivityListTransactionsType.All);
  useNftTokens();
  useErc20Tokens();

  return null;
};
