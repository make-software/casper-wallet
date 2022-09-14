import '@libs/i18n/i18n';
import 'mac-scrollbar/dist/mac-scrollbar.css';

import React, { Suspense, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { App } from './app';
import {
  backgroundEvent,
  BackgroundEvent,
  PopupState
} from '@background/background-events';
import { isActionOf } from 'typesafe-actions';
import browser from 'webextension-polyfill';
import { connectWindowInit } from '@background/redux/windowManagement/actions';
import { createMainStoreReplica } from '@background/redux/utils';
import { ErrorBoundary } from '@popup/error-boundary';
import { Provider as ReduxProvider } from 'react-redux/es/exports';

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
    browser.runtime.sendMessage(connectWindowInit());

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
      <ErrorBoundary>
        <ThemeProvider theme={themeConfig}>
          <GlobalStyle />
          <ReduxProvider store={store}>
            <App />
          </ReduxProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>
  );
};

render(<Tree />, document.querySelector('#signature-request-app-container'));
