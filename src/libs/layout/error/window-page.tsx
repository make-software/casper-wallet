import React from 'react';
import { NavigateFunction } from 'react-router';

import { PasswordDoesNotExistError } from '@src/errors';

import { closeCurrentWindow } from '@background/close-current-window';
import { openOnboardingUi } from '@background/open-onboarding-flow';
import { resetVault } from '@background/redux/sagas/actions';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  FooterButtonsContainer,
  HeaderPopup,
  LayoutWindow
} from '@libs/layout';
import { Button } from '@libs/ui/components';

import { ErrorPageContent } from './content';
import { ErrorLocationState } from './types';

interface ErrorPageProps {
  overrideState?: { state: Required<ErrorLocationState> };
  createTypedNavigate?: () => NavigateFunction;
  createTypedLocation?: () => Location & any;
  error?: Error | null;
}

export function WindowErrorPage({
  overrideState,
  createTypedNavigate,
  createTypedLocation,
  error
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
      renderHeader={() => <HeaderPopup />}
      renderContent={() => (
        <ErrorPageContent
          errorHeaderText={state.errorHeaderText}
          errorContentText={state.errorContentText}
          pageType="general"
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryBlue"
            onClick={async () => {
              if (error instanceof PasswordDoesNotExistError) {
                try {
                  dispatchToMainStore(resetVault());
                  closeCurrentWindow();
                  openOnboardingUi();
                  return;
                } catch (e) {}
              }

              return location?.state?.errorRedirectPath != null
                ? navigate(location.state.errorRedirectPath)
                : closeCurrentWindow();
            }}
          >
            {state.errorPrimaryButtonLabel}
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
}
