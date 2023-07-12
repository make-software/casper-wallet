import '@libs/i18n/i18n';

import React, { Suspense, useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { Provider as ReduxProvider } from 'react-redux';

import { importWindowInit } from '@src/background/redux/windowManagement/actions';
import {
  createMainStoreReplica,
  PopupState
} from '@src/background/redux/utils';
import { GlobalStyle, themeConfig } from '@libs/ui';
import { ErrorBoundary } from '@src/libs/layout/error';

import { AppRouter } from './app-router';
import { useSubscribeToRedux } from '@src/hooks/use-subscribe-to-redux';

const Tree = () => {
  const [state, setState] = useState<PopupState | null>(null);

  useSubscribeToRedux({
    windowInitAction: importWindowInit,
    setPopupState: setState
  });

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
