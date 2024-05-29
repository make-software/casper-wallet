import { createAction } from 'typesafe-actions';

import { AccountData } from '@libs/services/balance-service/types';

export const accountBalancesChanged = createAction('ACCOUNT_BALANCES_CHANGED')<
  AccountData[]
>();

export const accountBalancesReseted = createAction(
  'ACCOUNT_BALANCES_RESETED'
)<void>();
