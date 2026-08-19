import React, { useCallback, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { WalletQrCodePageContent } from '@popup/pages/wallet-qr-code/content';

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

import { buildQrSyncPayload } from './build-qr-sync-payload';

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

    const payload = await buildQrSyncPayload(derivedAccounts, importedAccounts);

    // A refused or incomplete payload must not reach the phone. Returning
    // resolves the promise the password page awaits, so it renders no form
    // error on top of the error page.
    if (!payload) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const worker = new Worker(
      new URL(
        '@background/workers/generate-sync-wallet-qr-data-worker.ts',
        import.meta.url
      )
    );

    // settles only once the QR data exists, so a worker failure rejects into
    // the password page's catch instead of leaving it spinning forever
    return new Promise<void>((resolve, reject) => {
      worker.postMessage({ password, ...payload });

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
