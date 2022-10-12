import React from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  LayoutTab,
  TabFooterContainer as TabFooterContainerBase
} from '@libs/layout';
import { Button } from '@src/libs/ui';
import { useUnlockWalletForm } from '@libs/ui/forms/unlock-wallet';

import { selectVaultPassword } from '@background/redux/vault/selectors';

import { RouterPath, useTypedNavigate } from '@src/apps/onboarding/router';
import { UnlockWalletPageContent } from '@src/apps/onboarding/pages/unlock-wallet/content';

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
  const vaultPassword = useSelector(selectVaultPassword);

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useUnlockWalletForm(vaultPassword);

  function onSubmit() {
    saveIsLoggedIn(true);
    navigate(RouterPath.CreateSecretPhrase);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LayoutTab
        layoutContext="withIllustration"
        renderContent={() => (
          <UnlockWalletPageContent
            register={register}
            errorMessage={errors.password?.message}
          />
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
