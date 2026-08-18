import React, { useCallback, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { WalletQrCodePageContent } from '@popup/pages/wallet-qr-code/content';

import {
  fetchAccountSecretKeys,
  fetchSecretPhrase
} from '@background/handlers/vault-secrets';
import {
  selectVaultDerivedAccounts,
  selectVaultImportedAccounts
} from '@background/redux/vault/selectors';
import { WorkerResult, isWorkerError } from '@background/workers/types';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  PrivateStateErrorPage
} from '@libs/layout';
import { requestWithRetry } from '@libs/messaging/request-with-retry';
import { Account } from '@libs/types/account';

interface GenerateWalletQrDataMessageEvent extends MessageEvent {
  data: WorkerResult<{
    result: string[];
  }>;
}

export const WalletQrCodePage = () => {
  const [qrStrings, setQrStrings] = useState<string[]>([]);
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const derivedAccounts = useSelector(selectVaultDerivedAccounts, shallowEqual);
  const importedAccounts = useSelector(
    selectVaultImportedAccounts,
    shallowEqual
  );

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  const generateQRCode = async (password: string) => {
    setIsLoading(true);

    const secretPhrase = await requestWithRetry(fetchSecretPhrase).catch(
      () => null
    );

    if (!secretPhrase) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // The worker sends only derived accounts' names — the mobile client re-derives their keys from the phrase.
    const secretKeys = await requestWithRetry(() =>
      fetchAccountSecretKeys(importedAccounts.map(a => a.name))
    ).catch(() => null);

    // A null/failed response must not turn into a partial payload: that would
    // silently sync imported accounts to the phone without their keys.
    if (!secretKeys) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Strip down to what the worker actually reads: `watching` (added by the
    // broadcast sanitizer) is not a field the mobile client expects.
    const forSync = (accounts: Account[]) =>
      accounts.map(({ name, publicKey }) => ({
        name,
        publicKey,
        secretKey: secretKeys[name] ?? ''
      }));

    const worker = new Worker(
      new URL(
        '@background/workers/generate-sync-wallet-qr-data-worker.ts',
        import.meta.url
      )
    );

    // settles only once the QR data exists, so a worker failure rejects into
    // the password page's catch instead of leaving it spinning forever
    return new Promise<void>((resolve, reject) => {
      worker.postMessage({
        password,
        secretPhrase,
        derivedAccounts: forSync(derivedAccounts),
        importedAccounts: forSync(importedAccounts)
      });

      const fail = (error: unknown) => {
        worker.terminate();
        setIsLoading(false);
        reject(error);
      };

      worker.onmessage = (event: GenerateWalletQrDataMessageEvent) => {
        if (isWorkerError(event.data)) {
          fail(new Error('Sync wallet QR generation failed'));
          return;
        }

        const { result } = event.data;

        worker.terminate();
        setQrStrings(result);
        setIsLoading(false);
        setPasswordConfirmed();
        resolve();
      };

      // only reached by a script load failure — a rejection inside the worker
      // arrives through onmessage instead
      worker.onerror = error => fail(error);
    });
  };

  if (hasError) {
    return (
      <PrivateStateErrorPage
        layout="popup"
        onRetry={() => setHasError(false)}
      />
    );
  }

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage onClick={generateQRCode} isLoading={isLoading} />
    );
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="back" />
          )}
        />
      )}
      renderContent={() => <WalletQrCodePageContent qrStrings={qrStrings} />}
    />
  );
};
