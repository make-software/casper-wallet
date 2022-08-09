import { createAction } from 'typesafe-actions';
import { TimeoutDurationSetting } from '@popup/constants';
import { Account } from '@popup/redux/vault/types';

export const createVault = createAction(
  'CREATE_VAULT',
  (payload: { password: string }) => ({
    password: payload.password,
    lastActivityTime: Date.now()
  })
)<{
  password: string;
  lastActivityTime: number;
}>();

export const resetVault = createAction('RESET_VAULT')<void>();

export const lockVault = createAction('LOCK_VAULT')<void>();

export const unlockVault = createAction('UNLOCK_VAULT', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const importAccount = createAction('IMPORT_ACCOUNT')<Account>();
export const removeAccount = createAction('REMOVE_ACCOUNT')<{
  accountName: string;
}>();
export const renameAccount = createAction('RENAME_ACCOUNT')<{
  oldName: string;
  newName: string;
}>();
export const changeActiveAccount = createAction(
  'CHANGE_ACTIVE_ACCOUNT'
)<string>();

export const changeTimeoutDuration = createAction(
  'CHANGE_TIMEOUT_DURATION',
  (payload: { timeoutDuration: TimeoutDurationSetting }) => ({
    timeoutDuration: payload.timeoutDuration,
    lastActivityTime: Date.now()
  })
)<{
  timeoutDuration: TimeoutDurationSetting;
  lastActivityTime: number;
}>();

export const refreshTimeout = createAction('REFRESH_TIMEOUT', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const connectAccountToSite = createAction('CONNECT_ACCOUNT_TO_SITE')<{
  siteOrigin: string;
  accountName: string;
}>();

export const disconnectAccountFromSite = createAction(
  'DISCONNECT_ACCOUNT_FROM_SITE'
)<{
  accountName: string;
  siteOrigin: string;
}>();

export const disconnectAllAccountsFromSite = createAction(
  'DISCONNECT_ALL_ACCOUNTS_FROM_SITE'
)<{
  siteOrigin: string;
}>();
