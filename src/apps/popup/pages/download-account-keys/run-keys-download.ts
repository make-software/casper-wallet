import JSZip from 'jszip';

import { createAsymmetricKeys } from '@libs/crypto/create-asymmetric-key';
import { AccountListRows } from '@libs/types/account';

import { DownloadAccountKeysSteps, downloadFile } from './utils';

export async function runKeysDownload(
  accounts: AccountListRows[],
  setStep: (step: DownloadAccountKeysSteps) => void
): Promise<void> {
  try {
    const zip = new JSZip();
    let skipped = 0;

    for (const account of accounts) {
      const asymmetricKey = createAsymmetricKeys(
        account.publicKey,
        account.secretKey
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
