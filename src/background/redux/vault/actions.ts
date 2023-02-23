import { createAction } from 'typesafe-actions';
import { Account, VaultState } from '@src/background/redux/vault/types';
import { SecretPhrase } from '@src/libs/crypto';

export const vaultReseted = createAction('VAULT_RESETED')<void>();

export const vaultLoaded = createAction('VAULT_LOADED')<VaultState>();

export const secretPhraseCreated = createAction(
  'SECRET_PHRASE_CREATED'
)<SecretPhrase>();

export const accountImported = createAction('ACCOUNT_IMPORTED')<Account>();
export const accountAdded = createAction('ACCOUNT_ADDED')<Account>();
export const accountRemoved = createAction('ACCOUNT_REMOVED')<{
  accountName: string;
}>();
export const accountRenamed = createAction('ACCOUNT_RENAMEED')<{
  oldName: string;
  newName: string;
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

export const activeAccountChanged = createAction(
  'ACTIVE_ACCOUNT_CHANGED'
)<string>();
