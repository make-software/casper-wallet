import React from 'react';
import { NavigateFunction } from 'react-router/lib/hooks';

import {
  LayoutTab,
  LayoutWindow,
  PopupHeader,
  HeaderSubmenuBarNavLink,
  FooterButtonsContainer
} from '@libs/layout';
import { Button } from '@libs/ui';

import { closeActiveWindow } from '@background/close-window';

import { LayoutType, LayoutTypeProp } from './types';
import { ErrorPageContent } from './content';

function getLayoutByType(layoutType: LayoutType) {
  switch (layoutType) {
    case 'window':
      return LayoutWindow;
    case 'tab':
      return LayoutTab;
    default:
      throw new Error('Unknown layout type');
  }
}

export interface ErrorPageProps extends LayoutTypeProp {
  createTypedNavigate: () => NavigateFunction;
  createTypedLocation: () => Location & any;
}

export function ErrorPage({
  createTypedNavigate,
  createTypedLocation,
  layoutType
}: ErrorPageProps) {
  const navigate = createTypedNavigate();
  const location = createTypedLocation();

  const state = location.state;

  if (state?.errorPrimaryButtonLabel == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  const Layout = getLayoutByType(layoutType);

  return (
    <Layout
      renderHeader={
        layoutType === 'window'
          ? () => (
              <PopupHeader
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink
                    linkType="close"
                    onClick={() => closeActiveWindow()}
                  />
                )}
              />
            )
          : undefined
      }
      renderContent={() => (
        <ErrorPageContent
          errorHeaderText={state.errorHeaderText}
          errorContentText={state.errorContentText}
          layoutType={layoutType}
        />
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryBlue"
            onClick={
              layoutType === 'tab'
                ? () =>
                    location.state?.errorRedirectPath != null
                      ? navigate(location.state.errorRedirectPath)
                      : navigate('/')
                : () =>
                    location.state?.errorRedirectPath != null
                      ? navigate(location.state.errorRedirectPath)
                      : closeActiveWindow()
            }
          >
            {state.errorPrimaryButtonLabel}
          </Button>
        </FooterButtonsContainer>
      )}
      layoutContext="withIllustration"
    />
  );
}
