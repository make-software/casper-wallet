import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { GlobalScrollbar } from 'mac-scrollbar';
import { ThemeProvider } from 'styled-components';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { App } from './app';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';
import { createStore } from './redux';

import { ErrorBoundary } from './error-boundary';

export let store: ReturnType<typeof createStore>;

const reduxStorageState = JSON.parse(
  localStorage.getItem(REDUX_STORAGE_KEY) || '{}'
);
// should initialize store only once when localstorage data is fetched
// @ts-ignore
if (store == null) {
  store = createStore(reduxStorageState);
  // each change should be saved in the localstorage
  store.subscribe(() => {
    const vault = store.getState();
    try {
      localStorage.setItem(REDUX_STORAGE_KEY, JSON.stringify(vault));
    } catch {
      // initialization workaround
    }
  });
}

render(
  <Suspense fallback={null}>
    <ErrorBoundary>
      <ThemeProvider theme={themeConfig}>
        <ReduxProvider store={store}>
          <GlobalStyle />
          <GlobalScrollbar />
          <HashRouter>
            <App />
          </HashRouter>
        </ReduxProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </Suspense>,
  window.document.querySelector('#app-container')
);

if ('hot' in module) {
  // TODO: handle `ts-ignore` directive
  // @ts-ignore
  module.hot.accept();
}
