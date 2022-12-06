import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import browser from 'webextension-polyfill';

import {
  ContentContainer,
  IllustrationContainer,
  TextContainer,
  FooterButtonsAbsoluteContainer
} from '@src/libs/layout/containers';
import { SvgIcon, Typography, Button, Checkbox } from '@src/libs/ui';

import { useTypedNavigate } from '@popup/router';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { resetVault } from '@src/background/redux/sagas/actions';

export function ResetVaultPageContent() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  function handleResetVault() {
    // It's hacky for Safari browser => browser.runtime.reload();
    // window.close() method can only be called on windows that were opened by a script using the Window.open() method.
    // If the window was > not opened by a script, an error similar to this one appears in the console:
    // Scripts may not close windows that were not opened by script
    dispatchToMainStore(resetVault()).then(() => {
      browser.runtime.reload();
    });
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <>
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon src="assets/illustrations/reset-wallet.svg" size={120} />
        </IllustrationContainer>
        <TextContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Are you sure you want to reset your wallet?</Trans>
          </Typography>
        </TextContainer>
        <TextContainer gap="medium">
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              All accounts will be removed. Make sure you have securely stored
              your Casper Wallet’s secret recovery phrase and any legacy secret
              key files. Without them you may be unable to access to the
              accounts.
            </Trans>
          </Typography>
        </TextContainer>
      </ContentContainer>
      <FooterButtonsAbsoluteContainer>
        <Checkbox
          label={t('I’ve read and understand the above')}
          checked={isChecked}
          onChange={(value: boolean) => {
            setIsChecked(value);
          }}
        />
        <Button
          onClick={handleResetVault}
          color="primaryRed"
          disabled={!isChecked}
        >
          <Trans t={t}>Reset wallet</Trans>
        </Button>
        <Button onClick={handleCancel} color="secondaryBlue">
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </>
  );
}
