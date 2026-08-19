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

  // The map is keyed by name and matched against the live vault, while these
  // names come from the replica snapshot — a rename or removal in another window
  // makes a key vanish. A non-watching account without one must fail the sync
  // rather than reach the phone as `secretKey: ''` behind a Success screen; the
  // key export path holds the same invariant (WALLET-1345).
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
    // The worker sends only derived accounts' names — the mobile client
    // re-derives their keys from the phrase.
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
