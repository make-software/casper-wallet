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
  // Mirrors the submit button's disabled state. Without it the field stays
  // editable while the password is being verified, so a user who hits Enter can
  // keep typing into a form that is already on its way out.
  disabled?: boolean;
}
export const UnlockProtectedPageContent = ({
  register,
  errors,
  title,
  disabled
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
          autoFocus
          disabled={disabled}
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
