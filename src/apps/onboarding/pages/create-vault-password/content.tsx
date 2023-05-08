import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { FormState, UseFormRegister } from 'react-hook-form';

import {
  PasswordInputType,
  Input,
  InputValidationType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui';
import {
  InputsContainer,
  TabPageContainer,
  TabTextContainer
} from '@libs/layout';
import { minPasswordLength } from '@libs/ui/forms/form-validation-rules';
import { CreatePasswordFormValues } from '@src/libs/ui/forms/create-password';

interface CreatePasswordPageContentProps {
  register: UseFormRegister<CreatePasswordFormValues>;
  formState: FormState<CreatePasswordFormValues>;
}

export function CreateVaultPasswordPageContent({
  register,
  formState: { errors }
}: CreatePasswordPageContentProps) {
  const { t } = useTranslation();

  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<PasswordInputType>('password');

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Create password</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            To ensure a strong password use at least{' '}
            <Typography type="bodySemiBold" color="contentPrimary">
              {{ minPasswordLength }} characters.
            </Typography>{' '}
            Think of a random and memorable passphrase. Avoid using personally
            identifiable information.
          </Trans>
        </Typography>
      </TabTextContainer>
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
    </TabPageContainer>
  );
}
