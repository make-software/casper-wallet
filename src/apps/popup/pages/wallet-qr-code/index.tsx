import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import {
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader,
  PopupLayout
} from '@libs/layout';
import { WalletQrCodePageContent } from '@popup/pages/wallet-qr-code/content';
import { useTypedNavigate } from '@popup/router';
import { Button } from '@libs/ui';
import { useCreatePasswordForQRCodeForm } from '@libs/ui/forms/create-password-for-qr-code';
import { calculateSubmitButtonDisabled } from '@libs/ui/forms/get-submit-button-state-from-validation';
import {
  selectSecretPhrase,
  selectVaultDerivedAccounts,
  selectVaultImportedAccounts
} from '@background/redux/vault/selectors';
import { generateSyncWalletQrData } from '@libs/crypto';

export const WalletQrCodePage = () => {
  const [qrString, setQrString] = useState('');

  const secretPhrase = useSelector(selectSecretPhrase);
  const derivedAccounts = useSelector(selectVaultDerivedAccounts, shallowEqual);
  const importedAccounts = useSelector(
    selectVaultImportedAccounts,
    shallowEqual
  );

  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const {
    register,
    formState: { errors, isValid },
    getValues
  } = useCreatePasswordForQRCodeForm();

  const isButtonDisabled = calculateSubmitButtonDisabled({
    isValid
  });

  const generateQRCode = async () => {
    const { password } = getValues();

    if (secretPhrase) {
      const qr = await generateSyncWalletQrData(
        password,
        secretPhrase,
        derivedAccounts,
        importedAccounts
      );

      setQrString(qr);
    }
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <PopupHeader
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="back"
              onClick={() => {
                if (qrString) {
                  setQrString('');
                } else {
                  navigate(-1);
                }
              }}
            />
          )}
        />
      )}
      renderContent={() => (
        <WalletQrCodePageContent
          qrString={qrString}
          register={register}
          errors={errors}
        />
      )}
      renderFooter={
        qrString
          ? undefined
          : () => (
              <FooterButtonsContainer>
                <Button
                  color="primaryBlue"
                  disabled={isButtonDisabled}
                  onClick={generateQRCode}
                >
                  <Trans t={t}>See QR code</Trans>
                </Button>
              </FooterButtonsContainer>
            )
      }
    />
  );
};
