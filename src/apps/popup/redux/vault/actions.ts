import { createAction } from 'typesafe-actions';
import { TimeoutDurationSetting } from '@popup/constants';
import { Account } from '@popup/redux/vault/types';

// actions that update storage state

export const vaultCreated = createAction(
  'VAULT_CREATED',
  (payload: { password: string }) => ({
    password: payload.password,
    lastActivityTime: Date.now()
  })
)<{
  password: string;
  lastActivityTime: number;
}>();

export const vaultReseted = createAction('VAULT_RESETED')<void>();

export const vaultLocked = createAction('VAULT_LOCKED')<void>();

export const vaultUnlocked = createAction('VAULT_UNLOCKED', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const accountImported = createAction('ACCOUNT_IMPORTED')<Account>();
export const accountRemoved = createAction('ACCOUNT_REMOVED')<{
  accountName: string;
}>();
export const accountRenamed = createAction('ACCOUNT_RENAMEED')<{
  oldName: string;
  newName: string;
}>();

export const activeOriginChanged = createAction('ACTIVE_ORIGIN_CHANGED')<
  string | null
>();

export const activeAccountChanged = createAction(
  'ACTIVE_ACCOUNT_CHANGED'
)<string>();

export const timeoutDurationChanged = createAction(
  'TIMEOUT_DURATION_CHANGED',
  (payload: { timeoutDuration: TimeoutDurationSetting }) => ({
    timeoutDuration: payload.timeoutDuration,
    lastActivityTime: Date.now()
  })
)<{
  timeoutDuration: TimeoutDurationSetting;
  lastActivityTime: number;
}>();

export const timeoutRefreshed = createAction('TIMEOUT_REFRESHED', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const accountsConnected = createAction('ACCOUNTS_CONNECTED')<{
  siteOrigin: string;
  accountNames: string[];
}>();

export const accountDisconnected = createAction('ACCOUNT_DISCONNECTED')<{
  accountName: string;
  siteOrigin: string;
}>();

export const allAccountsDisconnected = createAction(
  'ALL_ACCOUNTS_DISCONNECTED'
)<{
  siteOrigin: string;
}>();
