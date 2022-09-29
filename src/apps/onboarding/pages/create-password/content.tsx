import React, { useState } from 'react';

import { PageContainer, TextContainer } from '@onboarding/layout/containers';
import { useTranslation, Trans } from 'react-i18next';
import {
  Input,
  InputType,
  InputValidationType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui';

import { minPasswordLength } from '@libs/constants';
import { InputsContainer } from '@libs/layout';

export function CreatePasswordPageContent() {
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
              {/*{{ minPasswordLength }} characters*/}
              {/*12 characters*/}
              {minPasswordLength} characters
            </Typography>{' '}
            characters to ensure a strong passphrase.
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
          // {...register('password')}
          // error={!!errors.password}
          // validationText={errors.password?.message}
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
          // {...register('confirmPassword')}
          // error={!!errors.confirmPassword}
          // validationText={errors.confirmPassword?.message}
        />
      </InputsContainer>
    </PageContainer>
  );
}
