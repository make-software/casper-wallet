/**
 * USE CASES ACTIONS - don't update state in reducer, invoke state reducer events (imperative mode)
 */
import { createAction } from '@reduxjs/toolkit';

import { UnlockVault } from '@background/redux/sagas/types';

import { SecretPhrase } from '@libs/crypto';
import { Account } from '@libs/types/account';

export const startBackground = createAction('START_BACKGROUND_SAGA');
// `senderWindowId` is attached by the background handler (`redux-actions.ts`,
// from `MessageSender`), never by the UI dispatcher — the UI's own
// `resetVault()` calls stay zero-arg. Optional: absent for a non-tab sender.
export const resetVault = createAction(
  'RESET_VAULT_SAGA',
  (senderWindowId?: number) => ({ payload: { senderWindowId } })
);
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
export const changePassword = createAction<{
  currentPassword: string;
  password: string;
}>('CHANGE_PASSWORD_SAGA');
