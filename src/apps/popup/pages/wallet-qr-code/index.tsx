import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

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

export const WalletQrCodePage = () => {
  const [isQRGenerated, setIsQRGenerated] = useState(false);

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

  // TODO: add functionality
  const generateQRCode = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password } = getValues();

    setIsQRGenerated(true);
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
                if (isQRGenerated) {
                  setIsQRGenerated(false);
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
          isQRGenerated={isQRGenerated}
          register={register}
          errors={errors}
        />
      )}
      renderFooter={
        isQRGenerated
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
