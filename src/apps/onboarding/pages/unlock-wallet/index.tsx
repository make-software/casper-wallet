import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { UnlockWalletPageContent } from '@onboarding/pages/unlock-wallet/content';
import { RouterPath, useTypedNavigate } from '@onboarding/router';

import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import { loginRetryCountReseted } from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  LayoutTab,
  TabFooterContainer as TabFooterContainerBase
} from '@libs/layout';
import { Button } from '@libs/ui';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';

// Design of this page is temporary. Should be changed after it will be done in Figma
const TabFooterContainer = styled(TabFooterContainerBase)`
  margin-top: 0;
`;

interface UnlockWalletPageProps {
  saveIsLoggedIn: (isLoggedIn: boolean) => void;
}

export function UnlockWalletPage({ saveIsLoggedIn }: UnlockWalletPageProps) {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const loginRetryCount = useSelector(selectLoginRetryCount);
  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);

  if (passwordHash == null || passwordSaltHash == null) {
    throw Error("Password doesn't exist");
  }

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  function onSubmit() {
    dispatchToMainStore(loginRetryCountReseted());
    saveIsLoggedIn(true);
  }

  const retryLeft = 5 - loginRetryCount;

  if (retryLeft <= 0) {
    return (
      <LayoutTab
        layoutContext="withIllustration"
        renderContent={() => (
          <UnlockWalletPageContent
            register={register}
            errorMessage={errors.password?.message}
          >
            <Trans t={t}>You have 0 tries left</Trans>
          </UnlockWalletPageContent>
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button
              color="secondaryRed"
              onClick={() => navigate(RouterPath.ResetWallet)}
            >
              <Trans t={t}>Start again</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withIllustration"
        renderContent={() => (
          <UnlockWalletPageContent
            register={register}
            errorMessage={errors.password?.message}
          >
            <Trans t={t}>
              Please enter your password to unlock. You have{' '}
              <b>{{ retryLeft }}</b> tries left.
            </Trans>
          </UnlockWalletPageContent>
        )}
        renderFooter={() => (
          <TabFooterContainer>
            <Button disabled={!isDirty} color="primaryRed">
              <Trans t={t}>Unlock wallet</Trans>
            </Button>
            <Button
              color="secondaryRed"
              onClick={() => navigate(RouterPath.ResetWallet)}
            >
              <Trans t={t}>Start again</Trans>
            </Button>
          </TabFooterContainer>
        )}
      />
    </form>
  );
}
