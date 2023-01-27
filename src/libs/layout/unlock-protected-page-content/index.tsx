import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import {
  ContentContainer,
  IllustrationContainer,
  InputsContainer,
  TextContainer
} from '@libs/layout';
import {
  Input,
  PasswordInputType,
  PasswordVisibilityIcon,
  SvgIcon,
  Typography
} from '@libs/ui';
import { useLockWallet } from './use-lock-wallet';

interface PasswordFormValues {
  password: string;
}

interface PasswordPageContentType {
  register: UseFormRegister<PasswordFormValues>;
  errors: FieldErrors<PasswordFormValues>;
  description: string;
}
export const UnlockProtectedPageContent = ({
  register,
  errors,
  description
}: PasswordPageContentType) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();
  const retryLeft = useLockWallet();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/password.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Wallet password required</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          {description}{' '}
          <Trans t={t}>You have {{ retryLeft }} tries left.</Trans>
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
  );
};
