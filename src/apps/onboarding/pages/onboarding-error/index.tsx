import React from 'react';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath, useTypedLocation } from '@src/apps/onboarding/router';

import { OnboardingErrorPageContent } from './content';

export function OnboardingErrorPage() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  if (state?.errorPrimaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <OnboardingErrorPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={() => navigate(RouterPath.CreateSecretPhrase)}>
            {state.errorPrimaryButtonLabel}
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
