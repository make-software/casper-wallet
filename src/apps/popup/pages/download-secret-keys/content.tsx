import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  TextContainer,
  InputsContainer
} from '@src/libs/layout';
import {
  SvgIcon,
  Typography,
  Input,
  PasswordVisibilityIcon,
  PasswordInputType
} from '@src/libs/ui';
import { DownloadSecretKeysFormValues } from '@src/libs/ui/forms/download-secret-keys';

interface DownloadSecretKeysPageContentProps {
  register: UseFormRegister<DownloadSecretKeysFormValues>;
  errorMessage?: string;
}

export function DownloadSecretKeysPageContent({
  register,
  errorMessage
}: DownloadSecretKeysPageContentProps) {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/password.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>
            Enter your password to download account secret key
          </Trans>
        </Typography>
      </TextContainer>

      <InputsContainer>
        <Input
          type={passwordInputType}
          placeholder={t('Password')}
          error={!!errorMessage}
          validationText={errorMessage}
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
