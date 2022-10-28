import React from 'react';
import { NavigateFunction } from 'react-router/lib/hooks';

import {
  LayoutWindow,
  PopupHeader,
  HeaderSubmenuBarNavLink,
  FooterButtonsContainer
} from '@libs/layout';
import { Button } from '@libs/ui';

import { closeActiveWindow } from '@background/close-window';

import { ErrorPageContent } from './content';

interface ErrorPageProps {
  createTypedNavigate: () => NavigateFunction;
  createTypedLocation: () => Location & any;
}

export function WindowErrorPage({
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
    <LayoutWindow
      variant="default"
      renderHeader={() => (
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="close"
              onClick={() => closeActiveWindow()}
            />
          )}
        />
      )}
      renderContent={() => (
        <ErrorPageContent
          errorHeaderText={state.errorHeaderText}
          errorContentText={state.errorContentText}
          illustrationType="general"
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryBlue"
            onClick={() =>
              location.state?.errorRedirectPath != null
                ? navigate(location.state.errorRedirectPath)
                : closeActiveWindow()
            }
          >
            {state.errorPrimaryButtonLabel}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
