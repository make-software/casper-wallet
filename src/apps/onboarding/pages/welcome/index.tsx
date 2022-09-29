import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button, Typography } from '@libs/ui';

import { FooterContainer } from '@src/apps/onboarding/layout/containers';
import { Layout } from '@src/apps/onboarding/layout';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { WelcomePageContent } from './content';

export function WelcomePage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <Layout
      renderContent={() => <WelcomePageContent />}
      contentBackgroundColor="backgroundPrimary"
      renderFooter={() => (
        <FooterContainer>
          <Typography type="body" color="contentSecondary">
            <Trans t={t}>
              Tip: have a paper and pen handy. There will be a writing involved.
            </Trans>
          </Typography>
          <Button
            onClick={() => navigate(RouterPath.CreatePassword)}
            color="primaryRed"
          >
            <Trans t={t}>Get started</Trans>
          </Button>
        </FooterContainer>
      )}
    />
  );
}
