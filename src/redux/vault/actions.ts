import { createAction } from 'typesafe-actions';

export const createVault = createAction('CREATE_VAULT')<{
  password: string;
}>();

export const lockVault = createAction('LOCK_VAULT')<void>();
export const unlockVault = createAction('UNLOCK_LOCK')<void>();

export const createAccount = createAction('CREATE_ACCOUNT')<{
  name: string;
}>();
