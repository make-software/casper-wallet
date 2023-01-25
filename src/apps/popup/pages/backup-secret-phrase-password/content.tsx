import React from 'react';
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

interface BackupSecretPhrasePasswordFormValues {
  password: string;
}

interface BackupSecretPhrasePasswordPageContentType {
  passwordInputType: PasswordInputType;
  setPasswordInputType: React.Dispatch<React.SetStateAction<PasswordInputType>>;
  register: UseFormRegister<BackupSecretPhrasePasswordFormValues>;
  errors: FieldErrors<BackupSecretPhrasePasswordFormValues>;
  retryLeft: number;
}
export const BackupSecretPhrasePasswordPageContent = ({
  passwordInputType,
  setPasswordInputType,
  register,
  errors,
  retryLeft
}: BackupSecretPhrasePasswordPageContentType) => {
  const { t } = useTranslation();

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
          <Trans t={t}>
            Enter your password to reveal your secret recovery phrase. You have{' '}
            {{ retryLeft }} tries left.
          </Trans>
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
