import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  FooterButtonsContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

import { Typography, Button, Checkbox } from '@libs/ui';
import { useTypedNavigate } from '@popup/router';
import { resetVault } from '@popup/redux/vault/actions';

export function ResetVaultPageContent() {
  const [isChecked, setIsChecked] = useState(false);
  const dispatch = useDispatch();
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  function handleResetVault() {
    dispatch(resetVault());
  }

  function handleCancel() {
    navigate(-1);
  }

  return (
    <>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header" weight="bold">
            <Trans t={t}>Are you sure you want to reset your vault?</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" weight="regular" color="contentSecondary">
            <Trans t={t}>
              All accounts will be removed. Make sure you have securely stored
              the recovery phrase for each account before proceeding.
            </Trans>
          </Typography>
        </TextContainer>
      </ContentContainer>
      <FooterButtonsContainer>
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
      </FooterButtonsContainer>
    </>
  );
}
