import { createAction } from 'typesafe-actions';
import { Timeout } from '@src/app/types';

export const createVault = createAction('CREATE_VAULT')<{
  password: string;
}>();

export const lockVault = createAction('LOCK_VAULT')<void>();
export const unlockVault = createAction('UNLOCK_LOCK')<void>();

export const createAccount = createAction('CREATE_ACCOUNT')<{
  name: string;
}>();

export const changeTimeout = createAction('CHANGE_TIMEOUT')<{
  timeout: Timeout;
}>();

export const startTimeout = createAction('START_TIMEOUT')<void>();

export const clearTimeout = createAction('CLEAR_TIMEOUT')<void>();
