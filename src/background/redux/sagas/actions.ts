/**
 * USE CASES ACTIONS - don't update state in reducer, invoke state reducer events (imperative mode)
 */
import { createAction } from 'typesafe-actions';

import { UnlockVault } from '@background/redux/sagas/types';

import { SecretPhrase } from '@libs/crypto';
import { Account } from '@libs/types/account';

export const startBackground = createAction('START_BACKGROUND_SAGA')<void>();

export const resetVault = createAction('RESET_VAULT_SAGA')<void>();

export const lockVault = createAction('LOCK_VAULT_SAGA')<void>();

export const unlockVault = createAction('UNLOCK_VAULT_SAGA')<UnlockVault>();

export const initKeys = createAction('INIT_KEYS_SAGA')<{
  password: string;
}>();

export const initVault = createAction('INIT_VAULT_SAGA')<{
  secretPhrase: SecretPhrase;
}>();

export const recoverVault = createAction('RECOVER_VAULT_SAGA')<{
  secretPhrase: SecretPhrase;
  accounts: Account[];
}>();

export const createAccount = createAction('CREATE_ACCOUNT_SAGA')<{
  name?: string;
}>();
