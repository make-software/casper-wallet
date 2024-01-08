import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { closeActiveTab } from '@onboarding/utils/close-active-tab';

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
          <Button onClick={() => closeActiveTab()}>
            <Trans t={t}>Got it</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
