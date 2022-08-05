import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { GlobalScrollbar } from 'mac-scrollbar';
import { ThemeProvider } from 'styled-components';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { REDUX_STORAGE_KEY } from '@libs/services/constants';
import { GlobalStyle, themeConfig } from '@libs/ui';

import { App } from './app';
import { ErrorBoundary } from '@popup/error-boundary';
import { Provider as ReduxProvider } from 'react-redux';
import { createInitStore } from '@popup/redux/utils';

const initStore = createInitStore(REDUX_STORAGE_KEY);

initStore().then(store =>
  render(
    <Suspense fallback={null}>
      <ErrorBoundary>
        <ThemeProvider theme={themeConfig}>
          <GlobalStyle />
          <GlobalScrollbar />
          <ReduxProvider store={store}>
            <HashRouter>
              <App />
            </HashRouter>
          </ReduxProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Suspense>,
    window.document.querySelector('#app-container')
  )
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
