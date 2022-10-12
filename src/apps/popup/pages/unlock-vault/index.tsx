import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { RouterPath } from '@popup/router';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@src/libs/layout/containers';
import {
  PasswordInputType,
  Typography,
  Input,
  Button,
  PasswordVisibilityIcon
} from '@libs/ui';

import { selectVaultPassword } from '@src/background/redux/vault/selectors';
import { vaultUnlocked } from '@src/background/redux/vault/actions';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { useUnlockWalletForm } from '@src/libs/ui/forms/unlock-wallet';

export function UnlockVaultPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const vaultPassword = useSelector(selectVaultPassword);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useUnlockWalletForm(vaultPassword);

  function handleUnlockVault() {
    dispatchToMainStore(vaultUnlocked());
  }

  return (
    <form onSubmit={handleSubmit(handleUnlockVault)}>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header">
            <Trans t={t}>Your vault is locked</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>Please enter the password to unlock.</Trans>
          </Typography>
        </TextContainer>
        <InputsContainer>
          <Input
            type={passwordInputType}
            placeholder={t('Password')}
            error={!!errors.password}
            validationText={errors.password?.message}
            suffixIcon={
              <PasswordVisibilityIcon
                passwordInputType={passwordInputType}
                setPasswordInputType={setPasswordInputType}
              />
            }
            {...register('password')}
          />
        </InputsContainer>
      </ContentContainer>
      <FooterButtonsAbsoluteContainer>
        <Button disabled={!isDirty} type="submit">
          {t('Unlock vault')}
        </Button>
        <Button
          type="button"
          color="secondaryRed"
          onClick={() => navigate(RouterPath.ResetVault)}
        >
          {t('Reset vault')}
        </Button>
      </FooterButtonsAbsoluteContainer>
    </form>
  );
}
