import {
  fetchAccountSecretKeys,
  fetchSecretPhrase
} from '@background/handlers/vault-secrets';

import { SecretPhrase } from '@libs/crypto';
import { requestWithRetry } from '@libs/messaging/request-with-retry';
import { Account } from '@libs/types/account';

interface SyncAccount {
  name: string;
  publicKey: string;
  secretKey: string;
}

interface QrSyncPayload {
  secretPhrase: SecretPhrase;
  derivedAccounts: SyncAccount[];
  importedAccounts: SyncAccount[];
}

export async function buildQrSyncPayload(
  derivedAccounts: Account[],
  importedAccounts: Account[]
): Promise<QrSyncPayload | null> {
  const secretPhrase = await requestWithRetry(fetchSecretPhrase).catch(
    () => null
  );

  if (!secretPhrase) {
    return null;
  }

  const secretKeys = await requestWithRetry(() =>
    fetchAccountSecretKeys(importedAccounts.map(account => account.name))
  ).catch(() => null);

  if (!secretKeys) {
    return null;
  }

  // These names come from the replica snapshot while the map is keyed against the live vault: a
  // non-watching account whose key went missing must fail the sync, not reach the phone as `''`.
  const missing = importedAccounts.filter(
    account => account.watching !== true && !secretKeys[account.name]
  ).length;

  if (missing > 0) {
    // Count only — an account name is user data.
    console.error('syncQr: imported accounts missing their key', missing);
    return null;
  }

  return {
    secretPhrase,
    // The mobile client re-derives derived accounts' keys from the phrase.
    derivedAccounts: derivedAccounts.map(({ name, publicKey }) => ({
      name,
      publicKey,
      secretKey: ''
    })),
    // Reachable as `''` only for watch-only accounts: the check above ran first.
    importedAccounts: importedAccounts.map(({ name, publicKey }) => ({
      name,
      publicKey,
      secretKey: secretKeys[name] ?? ''
    }))
  };
}
