import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { OnboardingErrorPageContent } from './content';

export function OnboardingErrorPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <OnboardingErrorPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={() => navigate(RouterPath.CreateSecretPhrase)}>
            <Trans t={t}>Start over again</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
