import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@src/libs/ui';

import { App } from '@src/app';
import { REDUX_STORAGE_KEY } from '@src/services/constants';
import { createStore } from '@src/redux';

import { ErrorBoundary } from './error-boundary';

let store: ReturnType<typeof createStore>;

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
          <MemoryRouter>
            <App />
          </MemoryRouter>
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
