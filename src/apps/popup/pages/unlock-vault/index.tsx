import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { RouterPath } from '@popup/router';

import {
  ContentContainer,
  FooterButtonsAbsoluteContainer,
  IllustrationContainer,
  InputsContainer,
  TextContainer
} from '@src/libs/layout/containers';
import {
  PasswordInputType,
  Typography,
  Input,
  Button,
  PasswordVisibilityIcon,
  SvgIcon
} from '@src/libs/ui';

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
        <IllustrationContainer>
          <SvgIcon src="assets/illustrations/locked-wallet.svg" size={120} />
        </IllustrationContainer>
        <TextContainer gap="big">
          <Typography type="header">
            <Trans t={t}>Your wallet is locked</Trans>
          </Typography>
        </TextContainer>
        <TextContainer gap="medium">
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>Please enter your password to unlock.</Trans>
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
          {t('Unlock wallet')}
        </Button>
        <Button
          type="button"
          color="secondaryRed"
          onClick={() => navigate(RouterPath.ResetVault)}
        >
          {t('Reset wallet')}
        </Button>
      </FooterButtonsAbsoluteContainer>
    </form>
  );
}
