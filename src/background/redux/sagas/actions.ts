/**
 * USE CASES ACTIONS - don't update state in reducer, invoke state reducer events (imperative mode)
 */
import { createAction } from '@reduxjs/toolkit';

import { UnlockVault } from '@background/redux/sagas/types';

import { SecretPhrase } from '@libs/crypto';
import { Account } from '@libs/types/account';

export const startBackground = createAction('START_BACKGROUND_SAGA');
export const resetVault = createAction('RESET_VAULT_SAGA');
export const lockVault = createAction('LOCK_VAULT_SAGA');
export const openExportKeysWindow = createAction(
  'OPEN_EXPORT_KEYS_WINDOW_SAGA'
);
export const unlockVault = createAction<UnlockVault>('UNLOCK_VAULT_SAGA');
export const initKeys = createAction<{ password: string }>('INIT_KEYS_SAGA');
export const initVault = createAction<{ secretPhrase: SecretPhrase }>(
  'INIT_VAULT_SAGA'
);
export const recoverVault = createAction<{
  secretPhrase: SecretPhrase;
  accounts: Account[];
}>('RECOVER_VAULT_SAGA');
export const createAccount = createAction<{ name?: string }>(
  'CREATE_ACCOUNT_SAGA'
);
