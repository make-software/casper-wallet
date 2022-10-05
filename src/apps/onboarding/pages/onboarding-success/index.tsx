import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { closeActiveTab } from '@src/apps/onboarding/utils/close-active-tab';

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
