import React, { useState } from 'react';
import { FieldValues } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  PasswordInputType,
  Button,
  Input,
  InputValidationType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui';
import { vaultCreated } from '@background/redux/vault/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import { RouterPath, useTypedNavigate } from '@popup/router';
import {
  FooterButtonsAbsoluteContainer,
  ContentContainer,
  HeaderTextContainer,
  InputsContainer,
  TextContainer
} from '@layout/containers';

import { useCreatePasswordForm } from '@libs/ui/forms/create-password';
import { minPasswordLength } from '@libs/ui/forms/form-validation-rules';

export function CreateVaultPageContent() {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useCreatePasswordForm();

  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<PasswordInputType>('password');

  function onSubmit(data: FieldValues) {
    dispatchToMainStore(vaultCreated({ password: data.password }));

    navigate(RouterPath.Home);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ContentContainer>
        <HeaderTextContainer>
          <Typography type="header">
            <Trans t={t}>Create new vault</Trans>
          </Typography>
        </HeaderTextContainer>
        <TextContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Please set a password for your vault. Try to use at least{' '}
              <Typography type="bodySemiBold" color="contentPrimary">
                {{ minPasswordLength }} characters
              </Typography>{' '}
              to ensure a strong passphrase.
            </Trans>
          </Typography>
        </TextContainer>
        <InputsContainer>
          <Input
            validationType={InputValidationType.Password}
            type={passwordInputType}
            placeholder={t('Password')}
            oneColoredIcons
            suffixIcon={
              <PasswordVisibilityIcon
                passwordInputType={passwordInputType}
                setPasswordInputType={setPasswordInputType}
              />
            }
            {...register('password')}
            error={!!errors.password}
            validationText={errors.password?.message}
          />
          <Input
            type={confirmPasswordInputType}
            placeholder={t('Confirm password')}
            oneColoredIcons
            suffixIcon={
              <PasswordVisibilityIcon
                passwordInputType={confirmPasswordInputType}
                setPasswordInputType={setConfirmPasswordInputType}
              />
            }
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            validationText={errors.confirmPassword?.message}
          />
        </InputsContainer>
      </ContentContainer>
      <FooterButtonsAbsoluteContainer>
        <Button disabled={!isDirty}>
          <Trans t={t}>Create Vault</Trans>
        </Button>
      </FooterButtonsAbsoluteContainer>
    </form>
  );
}
