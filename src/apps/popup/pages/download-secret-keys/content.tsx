import React, { useState } from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import {
  ContentContainer,
  IllustrationContainer,
  InputsContainer
} from '@src/libs/layout';
import {
  SvgIcon,
  Typography,
  Input,
  PasswordVisibilityIcon,
  PasswordInputType
} from '@src/libs/ui';

const HeaderTextContainer = styled.div`
  margin-top: 16px;
  padding: 0 ${({ theme }) => theme.padding[1.6]} 0;
`;

interface DownloadSecretKeysPageContentProps {
  register: UseFormRegister<FieldValues>;
  errorMessage: string | null;
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
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Enter your password to download account keys</Trans>
        </Typography>
      </HeaderTextContainer>

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
