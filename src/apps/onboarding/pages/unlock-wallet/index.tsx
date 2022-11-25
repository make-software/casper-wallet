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

import { RouterPath, useTypedNavigate } from '@src/apps/onboarding/router';
import { UnlockWalletPageContent } from '@src/apps/onboarding/pages/unlock-wallet/content';
import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@src/background/redux/keys/selectors';

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

  const passwordHash = useSelector(selectPasswordHash);
  const passwordSaltHash = useSelector(selectPasswordSaltHash);

  const {
    register,
    handleSubmit,
    formState: { isDirty, errors }
  } = useUnlockWalletForm(passwordHash, passwordSaltHash);

  function onSubmit() {
    saveIsLoggedIn(true);
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
