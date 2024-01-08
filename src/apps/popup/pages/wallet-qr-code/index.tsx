import React, { useCallback, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { PasswordProtectionPage } from '@popup/pages/password-protection-page';
import { WalletQrCodePageContent } from '@popup/pages/wallet-qr-code/content';

import {
  selectSecretPhrase,
  selectVaultDerivedAccounts,
  selectVaultImportedAccounts
} from '@background/redux/vault/selectors';

import { generateSyncWalletQrData } from '@libs/crypto';
import {
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';

export const WalletQrCodePage = () => {
  const [qrStrings, setQrStrings] = useState<string[]>([]);
  const [isPasswordConfirmed, setIsPasswordConfirmed] =
    useState<boolean>(false);
  const [loading, setLoading] = useState(false);

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
      setLoading(true);
      const data = await generateSyncWalletQrData(
        password,
        secretPhrase,
        derivedAccounts,
        importedAccounts
      );

      setLoading(false);
      setQrStrings(data);
    }
  };

  if (!isPasswordConfirmed) {
    return (
      <PasswordProtectionPage
        setPasswordConfirmed={setPasswordConfirmed}
        onClick={generateQRCode}
        loading={loading}
      />
    );
  }

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
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
