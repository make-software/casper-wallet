import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { FieldValues, FormState, UseFormRegister } from 'react-hook-form';

import {
  Input,
  InputType,
  InputValidationType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui';
import { InputsContainer } from '@libs/layout';
import { minPasswordLength } from '@libs/forms/create-password';

import { PageContainer, TextContainer } from '@onboarding/layout/containers';

interface CreatePasswordPageContentProps {
  register: UseFormRegister<FieldValues>;
  formState: FormState<FieldValues>;
}

export function CreatePasswordPageContent({
  register,
  formState: { isDirty, errors }
}: CreatePasswordPageContentProps) {
  const { t } = useTranslation();

  const [passwordInputType, setPasswordInputType] =
    useState<InputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<InputType>('password');

  return (
    <PageContainer>
      <Typography type="header">
        <Trans t={t}>Create password</Trans>
      </Typography>

      <TextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            You’ll need it to unlock your Signer. Try to use at least{' '}
            <Typography type="bodySemiBold" color="contentPrimary">
              {minPasswordLength} characters
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
              inputType={passwordInputType}
              changeInputType={setPasswordInputType}
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
              inputType={confirmPasswordInputType}
              changeInputType={setConfirmPasswordInputType}
            />
          }
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          validationText={errors.confirmPassword?.message}
        />
      </InputsContainer>
    </PageContainer>
  );
}
