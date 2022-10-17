import React from 'react';

import {
  LayoutWindow,
  FooterButtonsContainer,
  HeaderSubmenuBarNavLink,
  PopupHeader
} from '@libs/layout';
import { ErrorContentPage } from '@src/libs/layout/error';
import { Button } from '@libs/ui';

import { closeActiveWindow } from '@background/close-window';

import {
  useTypedLocation,
  useTypedNavigate
} from '@src/apps/signature-request/router';

export function ErrorPage() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  if (state?.errorPrimaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <LayoutWindow
      Header={
        <PopupHeader
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink
              linkType="close"
              onClick={() => closeActiveWindow()}
            />
          )}
        />
      }
      Content={
        <ErrorContentPage
          errorHeaderText={state.errorHeaderText}
          errorContentText={state.errorContentText}
        />
      }
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryRed"
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
