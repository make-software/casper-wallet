import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button, Typography } from '@libs/ui';
import { LayoutTab, TabFooterContainer } from '@src/libs/layout';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { WelcomePageContent } from './content';

export function WelcomePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <WelcomePageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Tip: have a paper and pen handy. There will be a writing involved.
            </Trans>
          </Typography>
          <Button
            dataTestId="welcome:get-started-button"
            onClick={() => navigate(RouterPath.CreateVaultPassword)}
            color="primaryRed"
          >
            <Trans t={t}>Get started</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
