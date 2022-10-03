import React from 'react';

import { LayoutTab, TabFooterContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { useTypedLocation } from '@src/apps/onboarding/router/use-typed-location';
import { useTypedNavigate } from '@src/apps/onboarding/router/use-typed-navigate';
import { RouterPath } from '@src/apps/onboarding/router';

import { ErrorPageContent } from './content';

export function ErrorPage() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  if (state?.primaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => <ErrorPageContent />}
      renderFooter={() => (
        <TabFooterContainer>
          <Button onClick={() => navigate(RouterPath.CreateSecretPhrase)}>
            {state.primaryButtonLabel}
          </Button>
        </TabFooterContainer>
      )}
    />
  );
}
