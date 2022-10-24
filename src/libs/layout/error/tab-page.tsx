import React from 'react';
import { NavigateFunction } from 'react-router/lib/hooks';

import { LayoutTab, FooterButtonsContainer } from '@libs/layout';
import { Button } from '@libs/ui';

import { ErrorPageContent } from './content';

interface ErrorPageProps {
  createTypedNavigate: () => NavigateFunction;
  createTypedLocation: () => Location & any;
}

export function TabErrorPage({
  createTypedNavigate,
  createTypedLocation
}: ErrorPageProps) {
  const navigate = createTypedNavigate();
  const location = createTypedLocation();

  const state = location.state;

  if (state?.errorPrimaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <LayoutTab
      layoutContext="withIllustration"
      renderContent={() => (
        <ErrorPageContent
          errorHeaderText={state.errorHeaderText}
          errorContentText={state.errorContentText}
          illustrationType="onboarding"
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryBlue"
            onClick={() =>
              location.state?.errorRedirectPath != null
                ? navigate(location.state.errorRedirectPath)
                : navigate('/')
            }
          >
            {state.errorPrimaryButtonLabel}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
