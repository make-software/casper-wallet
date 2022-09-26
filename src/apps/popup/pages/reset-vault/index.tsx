import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer,
  FooterButtonsAbsoluteContainer
} from '@src/libs/layout/containers';

import { Typography, Button, Checkbox } from '@libs/ui';
import { useTypedNavigate } from '@popup/router';
import { vaultReseted } from '@src/background/redux/vault/actions';
import { dispatchToMainStore } from '../../../../background/redux/utils';

export function ResetVaultPageContent() {
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  function handleResetVault() {
    dispatchToMainStore(vaultReseted());
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header">
            <Trans t={t}>Are you sure you want to reset your vault?</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              All accounts will be removed. Make sure you have securely stored
              the recovery phrase for each account before proceeding.
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
          <Trans t={t}>Reset vault</Trans>
        </Button>
        <Button onClick={handleCancel} color="secondaryBlue">
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </>
  );
}
