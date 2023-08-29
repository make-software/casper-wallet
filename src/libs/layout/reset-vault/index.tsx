import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  ParagraphContainer,
  FooterButtonsAbsoluteContainer,
  SpacingSize
} from '@src/libs/layout/containers';
import { SvgIcon, Typography, Button, Checkbox } from '@src/libs/ui';

import { useTypedNavigate } from '@popup/router';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { resetVault } from '@src/background/redux/sagas/actions';
import { closeWindowByReloadExtension } from '@src/background/close-window-by-reload-extension';

export function ResetVaultPageContent() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  function handleResetVault() {
    dispatchToMainStore(resetVault()).then(() => {
      closeWindowByReloadExtension();
    });
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <>
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon
            src="assets/illustrations/reset-wallet.svg"
            width={200}
            height={120}
          />
        </IllustrationContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <Typography type="header">
            <Trans t={t}>Are you sure you want to reset your wallet?</Trans>
          </Typography>
        </ParagraphContainer>
        <ParagraphContainer top={SpacingSize.Medium}>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              All accounts will be removed. Make sure you have securely stored
              your Casper Wallet’s secret recovery phrase and any legacy secret
              key files. Without them you may be unable to access the accounts.
            </Trans>
          </Typography>
        </ParagraphContainer>
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
