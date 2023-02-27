import '@libs/i18n/i18n';
import 'mac-scrollbar/dist/mac-scrollbar.css';

import React, { Suspense, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { Provider as ReduxProvider } from 'react-redux';
import browser from 'webextension-polyfill';
import { isActionOf } from 'typesafe-actions';

import {
  backgroundEvent,
  BackgroundEvent,
  PopupState
} from '@src/background/background-events';
import { importWindowInit } from '@src/background/redux/windowManagement/actions';
import { createMainStoreReplica } from '@src/background/redux/utils';
import { GlobalStyle, themeConfig } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';

import { AppRouter } from './app-router';

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
    browser.runtime.sendMessage(importWindowInit());

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
