import { createAction } from 'typesafe-actions';
import { TimeoutDurationSetting } from '@popup/constants';
import { Account, VaultState } from '@src/background/redux/vault/types';
import { SecretPhrase } from '@src/libs/crypto';

/**
 * USE CASES ACTIONS - don't update state in reducer, invoke state reducer events (imperative mode)
 */

export const startApp = createAction('START_APP')<void>();

export const resetVault = createAction('RESET_VAULT')<void>();

export const lockVault = createAction('LOCK_VAULT')<void>();
export const unlockVault = createAction('UNLOCK_VAULT')<{ password: string }>();

export const createEmptyVault = createAction('CREATE_EMPTY_VAULT')<{
  password: string;
}>();

export const initializeVault = createAction('INITIALIZE_VAULT')<{
  secretPhrase: SecretPhrase;
}>();

export const createAccount = createAction('CREATE_ACCOUNT')<{
  name?: string;
}>();

/**
 * STATE UPDATE EVENTS - can update state in reducer (past tense)
 */

export const vaultStateUpdated = createAction('VAULT_STATE_UPDATED')<
  Partial<VaultState>
>();

export const vaultReseted = createAction('VAULT_RESETED')<void>();

export const vaultLocked = createAction('VAULT_LOCKED')<void>();

export const vaultUnlocked = createAction('VAULT_UNLOCKED', () => ({
  lastActivityTime: Date.now()
}))<{
  lastActivityTime: number;
}>();

export const accountImported = createAction('ACCOUNT_IMPORTED')<Account>();
export const accountAdded = createAction('ACCOUNT_ADDED')<Account>();
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

export const lastActivityTimeRefreshed = createAction(
  'LAST_ACTIVITY_TIME_REFRESHED',
  () => ({
    lastActivityTime: Date.now()
  })
)<{
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
