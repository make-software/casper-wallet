import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldValues, UseFormRegister } from 'react-hook-form';

import {
  TabPageContainer,
  TabTextContainer,
  InputsContainer
} from '@src/libs/layout';
import {
  PasswordInputType,
  Input,
  SvgIcon,
  Typography,
  InputValidationType,
  PasswordVisibilityIcon
} from '@libs/ui';

interface LoginPageContentProps {
  register: UseFormRegister<FieldValues>;
  errorMessage: string | null;
}

export function LoginPageContent({
  register,
  errorMessage
}: LoginPageContentProps) {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <SvgIcon src="assets/illustrations/locked-vault.svg" size={120} />
      <TabTextContainer>
        <Typography type="header">
          <Trans t={t}>Please enter the password to continue.</Trans>
        </Typography>
      </TabTextContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>Some description</Trans>
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
          error={!!errorMessage}
          validationText={errorMessage}
        />
      </InputsContainer>
    </TabPageContainer>
  );
}
