import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { UseFormRegister } from 'react-hook-form';
import styled from 'styled-components';

import {
  TabPageContainer as TabPageContainerBase,
  TabTextContainer,
  InputsContainer
} from '@src/libs/layout';
import {
  PasswordInputType,
  Input,
  Typography,
  InputValidationType,
  PasswordVisibilityIcon,
  SvgIcon
} from '@libs/ui';
import { UnlockWalletFormValues } from '@src/libs/ui/forms/unlock-wallet';

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
  register: UseFormRegister<UnlockWalletFormValues>;
  errorMessage?: string;
  children: React.ReactNode;
}

export function UnlockWalletPageContent({
  register,
  errorMessage,
  children
}: LoginPageContentProps) {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/locked-wallet.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>

      <GrayBackgroundContainer>
        <TabTextContainer>
          <Typography type="header">
            <Trans t={t}>Your wallet is locked</Trans>
          </Typography>
        </TabTextContainer>

        <TabTextContainer>
          <Typography type="body" color="contentSecondary">
            {children}
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
