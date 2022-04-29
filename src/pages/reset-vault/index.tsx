import React, { useState } from 'react';
import {
  ContentContainer,
  ButtonsContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

import { Typography, Button, Checkbox } from '@src/libs/ui';
import { Trans, useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetVault } from '@src/redux/vault/actions';

export function ResetVaultPageContent() {
  const [checked, setCheckedStatus] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  function resetVaultHandle() {
    dispatch(resetVault());
  }

  function cancelHandle() {
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
          <Typography type="body" weight="regular" variation="contentSecondary">
            <Trans t={t}>
              All accounts will be removed. Make sure you have securely stored
              the recovery phrase for each account before proceeding.
            </Trans>
          </Typography>
        </TextContainer>
      </ContentContainer>
      <ButtonsContainer>
        <Checkbox
          label={t('I’ve read and understand the above')}
          checked={checked}
          onChange={(value: boolean) => {
            setCheckedStatus(value);
          }}
        />
        <Button
          onClick={resetVaultHandle}
          color="primaryRed"
          disabled={!checked}
        >
          <Trans t={t}>Reset vault</Trans>
        </Button>
        <Button onClick={cancelHandle} color="secondaryBlue">
          <Trans t={t}>Cancel</Trans>
        </Button>
      </ButtonsContainer>
    </>
  );
}
