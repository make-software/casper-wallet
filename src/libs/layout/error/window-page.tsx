import React from 'react';
import { NavigateFunction } from 'react-router';

import {
  LayoutWindow,
  PopupHeader,
  FooterButtonsContainer
} from '@libs/layout';
import { Button } from '@libs/ui';

import { closeActiveWindow } from '@background/close-window';

import { ErrorPageContent } from './content';
import { ErrorLocationState } from './types';

interface ErrorPageProps {
  overrideState?: { state: Required<ErrorLocationState> };
  createTypedNavigate?: () => NavigateFunction;
  createTypedLocation?: () => Location & any;
}

export function WindowErrorPage({
  overrideState,
  createTypedNavigate,
  createTypedLocation
}: ErrorPageProps) {
  const navigate = createTypedNavigate
    ? createTypedNavigate()
    : closeActiveWindow;
  const location = createTypedLocation && createTypedLocation();

  const state: Required<ErrorLocationState> =
    overrideState?.state || location.state;

  if (state?.errorPrimaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <LayoutWindow
      variant="default"
      renderHeader={() => <PopupHeader />}
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
              location?.state?.errorRedirectPath != null
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
