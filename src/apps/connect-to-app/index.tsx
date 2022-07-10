import '@libs/i18n/i18n';

import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { createStore } from '@popup/redux';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';

import { App } from '@connect-to-app/app';

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
    <ThemeProvider theme={themeConfig}>
      <GlobalStyle />
      <ReduxProvider store={store}>
        <HashRouter>
          <App />
        </HashRouter>
      </ReduxProvider>
    </ThemeProvider>
  </Suspense>,
  document.querySelector('#connect-to-app-app-container')
);
