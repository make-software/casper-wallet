import JSZip from 'jszip';

import { fetchAccountSecretKeys } from '@background/handlers/vault-secrets';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { requestWithRetry } from '@libs/messaging/request-with-retry';
import { AccountListRows } from '@libs/types/account';

import { DownloadAccountKeysSteps, downloadFile } from './utils';

export async function runKeysDownload(
  accounts: AccountListRows[],
  setStep: (step: DownloadAccountKeysSteps) => void
): Promise<void> {
  try {
    const zip = new JSZip();
    let skipped = 0;

    const secretKeys = await requestWithRetry(() =>
      fetchAccountSecretKeys(accounts.map(account => account.name))
    );

    // A refused/null response must not fall back to an empty map: every account
    // would then be silently skipped below, producing an empty zip with a
    // Success screen. Throwing routes it into the catch's Failure step.
    if (secretKeys == null) {
      throw new Error('fetchAccountSecretKeys returned null');
    }

    for (const account of accounts) {
      const asymmetricKey = createAsymmetricKeys(
        account.publicKey,
        secretKeys[account.name] ?? ''
      );

      if (asymmetricKey.secretKey) {
        zip.file(
          `${account.name}_secret_key.pem`,
          asymmetricKey.secretKey.toPem()
        );
      } else {
        skipped++;
      }
    }

    if (skipped > 0) {
      // Count only — an account name is user data, and a partial archive must
      // never reach Success.
      console.error(
        'downloadKeys: selected accounts produced no key file',
        skipped
      );
      setStep(DownloadAccountKeysSteps.Failure);
      return;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    downloadFile(new Blob([content]), 'casper-wallet-secret_keys.zip');

    setStep(DownloadAccountKeysSteps.Success);
  } catch (error) {
    // Only the error name is logged — the thrown value is built from key
    // material and must not reach the console.
    console.error(
      'downloadKeys: failed to build or download the keys archive',
      error instanceof Error ? error.name : 'unknown error'
    );
    setStep(DownloadAccountKeysSteps.Failure);
  }
}
