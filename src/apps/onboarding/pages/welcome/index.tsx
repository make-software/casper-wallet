import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button, Typography } from '@libs/ui';
import { LayoutTab, TabFooterContainer } from '@src/libs/layout';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { WelcomePageContent } from './content';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { resetVault } from '@src/background/redux/sagas/actions';

export function WelcomePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    dispatchToMainStore(resetVault()).then(() => {
      navigate(RouterPath.CreateVaultPassword);
    });
  };

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <WelcomePageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Tip: Have a pen and paper handy. You’ll need to write down your
              wallet’s secret recovery phrase.
            </Trans>
          </Typography>
          <Button onClick={handleClick} color="primaryRed">
            <Trans t={t}>Get started</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
