import '@libs/i18n/i18n';
import 'mac-scrollbar/dist/mac-scrollbar.css';

import React, { Suspense, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { AppRouter } from './app-router';
import {
  backgroundEvent,
  BackgroundEvent
} from '@background/background-events';
import { isActionOf } from 'typesafe-actions';
import browser from 'webextension-polyfill';
import { signWindowInit } from '@background/redux/windowManagement/actions';
import { createMainStoreReplica, PopupState } from '@background/redux/utils';
import { Provider as ReduxProvider } from 'react-redux/es/exports';
import { ErrorBoundary } from '@src/libs/layout/error';

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
    browser.runtime.sendMessage(signWindowInit()).catch(err => {
      console.error('sign window init');
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
