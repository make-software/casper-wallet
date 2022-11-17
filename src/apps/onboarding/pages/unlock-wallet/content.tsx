import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldValues, UseFormRegister } from 'react-hook-form';
import styled from 'styled-components';

import {
  TabPageContainer as TabPageContainerBase,
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

// Design of this page is temporary. Should be changed after it will be done in Figma
const TabPageContainer = styled.div`
  padding-top: 24px;
`;

const IllustrationContainer = styled(TabPageContainerBase)``;

// It's need for good reading
const GrayBackgroundContainer = styled(TabPageContainerBase)`
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

interface LoginPageContentProps {
  register: UseFormRegister<FieldValues>;
  errorMessage: string | null;
}

export function UnlockWalletPageContent({
  register,
  errorMessage
}: LoginPageContentProps) {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/locked-vault.svg" size={120} />
      </IllustrationContainer>

      <GrayBackgroundContainer>
        <TabTextContainer>
          <Typography type="header">
            <Trans t={t}>Your wallet is locked</Trans>
          </Typography>
        </TabTextContainer>

        <TabTextContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>Please enter your password to unlock.</Trans>
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
      </GrayBackgroundContainer>
    </TabPageContainer>
  );
}
