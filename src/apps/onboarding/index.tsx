import '@libs/i18n/i18n';

import React, { Suspense, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { isActionOf } from 'typesafe-actions';
import { Provider as ReduxProvider } from 'react-redux';
import browser from 'webextension-polyfill';
import { ThemeProvider } from 'styled-components';

import { ErrorBoundary } from '@src/libs/layout/error';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { AppRouter } from '@src/apps/onboarding/app-router';

import {
  backgroundEvent,
  BackgroundEvent
} from '@background/background-events';
import { onboardingAppInit } from '@background/redux/windowManagement/actions';
import { createMainStoreReplica, PopupState } from '@background/redux/utils';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  // setup listener to state events
  useEffect(() => {
    function handleBackgroundMessage(message: BackgroundEvent) {
      if (isActionOf(backgroundEvent.popupStateUpdated)(message)) {
        setState(message.payload);
      }
    }
    browser.runtime.onMessage.addListener(handleBackgroundMessage);
    browser.runtime.sendMessage(onboardingAppInit());

    return () => {
      browser.runtime.onMessage.removeListener(handleBackgroundMessage);
    };
  }, []);

  if (state == null) {
    return null;
  }

  const store = createMainStoreReplica(state);

  return (
    <Suspense fallback={null}>
      <ThemeProvider theme={themeConfig}>
        <GlobalStyle />
        <ReduxProvider store={store}>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </ReduxProvider>
      </ThemeProvider>
    </Suspense>
  );
};

render(<Tree />, document.querySelector('#app-container'));
