import React, { useCallback, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { WalletQrCodePageContent } from '@popup/pages/wallet-qr-code/content';

import {
  selectSecretPhrase,
  selectVaultDerivedAccounts,
  selectVaultImportedAccounts
} from '@background/redux/vault/selectors';

import {
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout
} from '@libs/layout';

interface GenerateWalletQrDataMessageEvent extends MessageEvent {
  data: {
    result: string[];
  };
}

export const WalletQrCodePage = () => {
  const [qrStrings, setQrStrings] = useState<string[]>([]);
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const secretPhrase = useSelector(selectSecretPhrase);
  const derivedAccounts = useSelector(selectVaultDerivedAccounts, shallowEqual);
  const importedAccounts = useSelector(
    selectVaultImportedAccounts,
    shallowEqual
  );

  const setPasswordConfirmed = useCallback(() => {
    setIsPasswordConfirmed(true);
  }, []);

  const generateQRCode = async (password: string) => {
    if (secretPhrase) {
      setIsLoading(true);

      const worker = new Worker(
        new URL(
          '@background/workers/generate-sync-wallet-qr-data-worker.ts',
          import.meta.url
        )
      );

      worker.postMessage({
        password,
        secretPhrase,
        derivedAccounts,
        importedAccounts
      });

      worker.onmessage = (event: GenerateWalletQrDataMessageEvent) => {
        const { result } = event.data;

        setQrStrings(result);
        setPasswordConfirmed();
      };

      worker.onerror = error => {
        console.error(error);
        setIsLoading(false);
      };
    }
  };

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
