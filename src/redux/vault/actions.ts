import { createAction } from 'typesafe-actions';
import { Timeout } from '@src/app/types';

export const createVault = createAction('CREATE_VAULT')<{
  password: string;
  timeoutStartTime: number;
}>();

export const lockVault = createAction('LOCK_VAULT')<void>();
export const unlockVault = createAction('UNLOCK_LOCK')<{
  timeoutStartTime: number;
}>();

export const createAccount = createAction('CREATE_ACCOUNT')<{
  name: string;
}>();

export const changeTimeout = createAction('CHANGE_TIMEOUT')<{
  timeoutDuration: Timeout;
  timeoutStartTime: number;
}>();
