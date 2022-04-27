import './i18n';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// import browser from 'webextension-polyfill';

import { createStore } from '@src/redux';
import { REDUX_STORAGE_KEY } from '@src/services/constants';

import { Layout, Header } from '@src/layout';
import { IconButtons } from '@src/layout/icon-buttons';

import { CreateVaultPageContent } from '@src/pages/create-vault';
import { NoAccountsPageContent } from '@src/pages/no-accounts';
import { UnlockVaultPageContent } from '@src/pages/unlock-vault';
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
              path={RoutePath.Home}
              element={
                <Layout
                  Header={<Header IconButtons={<IconButtons lock />} />}
                  Content={<HomePageContent />}
                />
              }
            />
            <Route
              path={RoutePath.CreateVault}
              element={
                <Layout
                  Header={<Header />}
                  Content={<CreateVaultPageContent />}
                />
              }
            />
            <Route
              path={RoutePath.NoAccounts}
              element={
                <Layout
                  Header={<Header IconButtons={<IconButtons lock />} />}
                  Content={<NoAccountsPageContent />}
                />
              }
            />
            <Route
              path={RoutePath.UnlockVault}
              element={
                <Layout
                  Header={<Header />}
                  Content={<UnlockVaultPageContent />}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ReduxProvider>
    </ErrorBoundary>
  );
}
