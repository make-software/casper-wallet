import './i18n';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// import browser from 'webextension-polyfill';

import { createStore } from '@src/redux';
import { REDUX_STORAGE_KEY } from '@src/services/constants';

import { Layout } from '@src/layout';
import {
  CreateVaultPageContent,
  CreateVaultPageFooter
} from '@src/pages/create-vault';
import {
  CreateAccountPageContent,
  CreateAccountPageFooter
} from '@src/pages/create-account';
import { HomePageContent } from '@src/pages/home';

import { Routes as RoutePath } from './routes';
import { ErrorBoundary } from './error-boundary';

let store: ReturnType<typeof createStore>;

export function App() {
  const reduxStorageState = JSON.parse(
    localStorage.getItem(REDUX_STORAGE_KEY) || '{}'
  );

  // should initialize store only once when localstorage data is fetched
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

  return (
    <ErrorBoundary>
      <ReduxProvider store={store}>
        <MemoryRouter>
          <Routes>
            <Route
              path={RoutePath.home}
              element={
                <Layout
                  Header={<></>}
                  Content={<HomePageContent />}
                  Footer={<></>}
                />
              }
            />
            <Route
              path={RoutePath.createVault}
              element={
                <Layout
                  Header={<></>}
                  Content={<CreateVaultPageContent />}
                  Footer={<CreateVaultPageFooter />}
                />
              }
            />
            <Route
              path={RoutePath.createAccount}
              element={
                <Layout
                  Header={<></>}
                  Content={<CreateAccountPageContent />}
                  Footer={<CreateAccountPageFooter />}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
