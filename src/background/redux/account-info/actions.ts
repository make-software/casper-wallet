import { createAction } from 'typesafe-actions';

import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  Erc20TokenActionResult,
  ExtendedDeployResult,
  LedgerLiveDeploysWithId
} from '@libs/services/account-activity-service';

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

export const accountErc20ActivityChanged = createAction(
  'ACCOUNT_ERC20_ACTIVITY_CHANGED'
)<Erc20TokenActionResult[] | null>();

export const accountErc20ActivityUpdated = createAction(
  'ACCOUNT_ERC20_ACTIVITY_UPDATED'
)<Erc20TokenActionResult[]>();

export const accountActivityReset = createAction('ACCOUNT_ACTIVITY_RESET')();

export const accountPendingTransactionsChanged = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_CHANGED'
)<ExtendedDeployResult>();

export const accountPendingTransactionsRemove = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_REMOVE'
)<string>();
