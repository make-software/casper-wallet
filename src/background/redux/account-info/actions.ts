import { createAction } from 'typesafe-actions';

import { ActiveAccountBalance } from '@libs/services/balance-service';
import { LedgerLiveDeploysWithId } from '@libs/services/account-activity-service';

export const accountBalanceChanged = createAction(
  'ACCOUNT_BALANCE_CHANGED'
)<ActiveAccountBalance>();

export const accountCurrencyRateChanged = createAction(
  'ACCOUNT_CURRENCY_RATE_CHANGED'
)<number | null>();

export const accountActivityChanged = createAction('ACCOUNT_ACTIVITY_CHANGED')<
  LedgerLiveDeploysWithId[] | null
>();

export const accountActivityUpdated = createAction('ACCOUNT_ACTIVITY_UPDATED')<
  LedgerLiveDeploysWithId[]
>();

export const accountActivityReset = createAction('ACCOUNT_ACTIVITY_RESET')();
