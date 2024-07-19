import React, { useState } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectHasLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';

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
import { UnlockWalletFormValues } from '@libs/ui/forms/unlock-wallet';

interface UnlockVaultPageContentProps {
  register: UseFormRegister<UnlockWalletFormValues>;
  errors: FieldErrors<UnlockWalletFormValues>;
}

export function UnlockVaultPageContent({
  register,
  errors
}: UnlockVaultPageContentProps) {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();
  const hasLoginRetryLockoutTime = useSelector(selectHasLoginRetryLockoutTime);

  if (hasLoginRetryLockoutTime) {
    return (
      <>
        <ContentContainer>
          <IllustrationContainer>
            <SvgIcon
              src="assets/illustrations/password-lock.svg"
              width={210}
              height={120}
            />
          </IllustrationContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <Typography type="header">
              <Trans t={t}>
                Please wait before the next attempt to unlock your wallet
              </Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                You’ve reached the maximum number of unlock attempts. For
                security reasons, you will need to wait a brief while before you
                can attempt again.
              </Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>
                You can try again in <b>5 mins.</b>
              </Trans>
            </Typography>
          </ParagraphContainer>
        </ContentContainer>
      </>
    );
  }

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/locked-wallet.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Your wallet is locked</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>Please enter your password to unlock.</Trans>
        </Typography>
      </ParagraphContainer>
      <InputsContainer>
        <Input
          type={passwordInputType}
          placeholder={t('Password')}
          error={!!errors.password}
          validationText={errors.password?.message}
          autoFocus
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
}
