import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { WalletQrCodePageContent } from '@popup/pages/wallet-qr-code/content';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { Button } from '@libs/ui';
import {
  selectSecretPhrase,
  selectVaultDerivedAccounts,
  selectVaultImportedAccounts
} from '@background/redux/vault/selectors';
import { generateSyncWalletQrData } from '@libs/crypto';
import { BackupSecretPhrasePasswordPage } from '@popup/pages/backup-secret-phrase-password';

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

  const navigate = useTypedNavigate();
  const { t } = useTranslation();

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
      <BackupSecretPhrasePasswordPage
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
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button onClick={() => navigate(RouterPath.Home)}>
            <Trans t={t}>I'm done</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
