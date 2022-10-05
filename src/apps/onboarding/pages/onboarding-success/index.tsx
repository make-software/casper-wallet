import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { OnboardingSuccessPageContent } from './content';

export function OnboardingSuccessPage() {
  const { t } = useTranslation();

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <OnboardingSuccessPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button>
            <Trans t={t}>Got it</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
