import { createAction } from 'typesafe-actions';

import { ActiveAccountBalance } from '@libs/services/balance-service';
import {
  Erc20TokenActionResult,
  ExtendedDeploy,
  ExtendedDeployWithId,
  TransferResultWithId
} from '@libs/services/account-activity-service';
import { ContractPackageWithBalance } from '@src/libs/services/erc20-service';

export const accountBalanceChanged = createAction(
  'ACCOUNT_BALANCE_CHANGED'
)<ActiveAccountBalance>();

export const accountErc20Changed = createAction('ACCOUNT_ERC20_CHANGED')<
  ContractPackageWithBalance[]
>();

export const accountCurrencyRateChanged = createAction(
  'ACCOUNT_CURRENCY_RATE_CHANGED'
)<number | null>();

export const accountCasperActivityChanged = createAction(
  'ACCOUNT_CASPER_ACTIVITY_CHANGED'
)<TransferResultWithId[] | null>();

export const accountCasperActivityUpdated = createAction(
  'ACCOUNT_CASPER_ACTIVITY_UPDATED'
)<TransferResultWithId[]>();

export const accountErc20ActivityChanged = createAction(
  'ACCOUNT_ERC20_ACTIVITY_CHANGED'
)<Erc20TokenActionResult[] | null>();

export const accountErc20ActivityUpdated = createAction(
  'ACCOUNT_ERC20_ACTIVITY_UPDATED'
)<Erc20TokenActionResult[]>();

export const accountActivityReset = createAction('ACCOUNT_ACTIVITY_RESET')();

export const accountPendingTransactionsChanged = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_CHANGED'
)<ExtendedDeploy>();

export const accountPendingTransactionsRemove = createAction(
  'ACCOUNT_PENDING_TRANSACTIONS_REMOVE'
)<string>();

export const accountDeploysChanged = createAction('ACCOUNT_DEPLOYS_CHANGED')<
  ExtendedDeployWithId[]
>();

export const accountDeploysUpdated = createAction('ACCOUNT_DEPLOYS_UPDATED')<
  ExtendedDeployWithId[]
>();
