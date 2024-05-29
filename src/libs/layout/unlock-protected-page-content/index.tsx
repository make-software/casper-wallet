import React, { useState } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';

import { useLockWalletWhenNoMoreRetries } from '@hooks/use-lock-wallet-when-no-more-retries';

import {
  ContentContainer,
  IllustrationContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import {
  Input,
  PasswordInputType,
  PasswordVisibilityIcon,
  SvgIcon,
  Typography
} from '@libs/ui/components';

interface PasswordFormValues {
  password: string;
}

interface PasswordPageContentType {
  register: UseFormRegister<PasswordFormValues>;
  errors: FieldErrors<PasswordFormValues>;
  title?: string;
}
export const UnlockProtectedPageContent = ({
  register,
  errors,
  title
}: PasswordPageContentType) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  const loginRetryCount = useSelector(selectLoginRetryCount);

  useLockWalletWhenNoMoreRetries();

  const retryLeft = 5 - loginRetryCount;

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/password.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>{title || 'Enter your password'}</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans
            defaults="You have <bold>{{retryLeft}}</bold> tries left."
            values={{
              retryLeft
            }}
            components={{ bold: <strong /> }}
          />
        </Typography>
      </ParagraphContainer>
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
