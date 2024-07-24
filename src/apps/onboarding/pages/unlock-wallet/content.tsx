import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  InputsContainer,
  TabPageContainer as TabPageContainerBase,
  TabTextContainer
} from '@libs/layout';
import {
  Input,
  InputValidationType,
  PasswordInputType,
  PasswordVisibilityIcon,
  SvgIcon,
  Typography
} from '@libs/ui/components';
import { UnlockWalletFormValues } from '@libs/ui/forms/unlock-wallet';

// Design of this page is temporary. Should be changed after it will be done in Figma
const TabPageContainer = styled.div``;

const IllustrationContainer = styled(TabPageContainerBase)``;

// It's need for good reading
const GrayBackgroundContainer = styled(TabPageContainerBase)`
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
  padding-bottom: 28px;
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
            autoFocus
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
