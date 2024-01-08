import React from 'react';
import { NavigateFunction } from 'react-router';

import { closeCurrentWindow } from '@background/close-current-window';

import {
  FooterButtonsContainer,
  LayoutWindow,
  PopupHeader
} from '@libs/layout';
import { Button } from '@libs/ui';

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
    : closeCurrentWindow;
  const location = createTypedLocation && createTypedLocation();

  const state: Required<ErrorLocationState> =
    overrideState?.state || location.state;

  if (state?.errorPrimaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <LayoutWindow
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
                : closeCurrentWindow()
            }
          >
            {state.errorPrimaryButtonLabel}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
