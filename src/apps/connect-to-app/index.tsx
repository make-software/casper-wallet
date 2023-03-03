import '@libs/i18n/i18n';
import 'mac-scrollbar/dist/mac-scrollbar.css';

import React, { Suspense, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { isActionOf } from 'typesafe-actions';
import browser from 'webextension-polyfill';

import { AppRouter } from '@src/apps/connect-to-app/app-router';
import { GlobalStyle, themeConfig } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';

import {
  BackgroundEvent,
  backgroundEvent
} from '@src/background/background-events';
import {
  createMainStoreReplica,
  PopupState
} from '@src/background/redux/utils';
import { connectWindowInit } from '@src/background/redux/windowManagement/actions';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  // setup listener to state events
  useEffect(() => {
    function handleStateUpdate(message: BackgroundEvent) {
      if (isActionOf(backgroundEvent.popupStateUpdated)(message)) {
        setState(message.payload);
      }
    }
    browser.runtime.onMessage.addListener(handleStateUpdate);
    browser.runtime.sendMessage(connectWindowInit()).catch(err => {
      console.error('connect window init');
    });

    return () => {
      browser.runtime.onMessage.removeListener(handleStateUpdate);
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
