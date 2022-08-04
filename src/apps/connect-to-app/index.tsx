import '@libs/i18n/i18n';

import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux/es/exports';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@libs/ui';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';

import { App } from '@connect-to-app/app';
import { ErrorBoundary } from '@popup/error-boundary';
import { createInitStore } from '@popup/redux/utils';

const initStore = createInitStore(REDUX_STORAGE_KEY);

initStore().then(store => {
  render(
    <Suspense fallback={null}>
      <ErrorBoundary>
        <ThemeProvider theme={themeConfig}>
          <GlobalStyle />
          <ReduxProvider store={store}>
            <HashRouter>
              <App />
            </HashRouter>
          </ReduxProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>,
    window.document.querySelector('#connect-to-app-app-container')
  );
});
