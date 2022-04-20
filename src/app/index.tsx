import './i18n';

import React, { Suspense } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
// import browser from 'webextension-polyfill';

import { Layout } from '@src/layout';
import {
  CreateVaultPageContent,
  CreateVaultPageFooter
} from '@src/pages/create-vault';
import { createStore } from '@src/redux';
import { REDUX_STORAGE_KEY } from '@src/services/constants';

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
      const { vault } = store.getState();
      try {
        localStorage.setItem(REDUX_STORAGE_KEY, JSON.stringify(vault));
      } catch {
        // initialization workaround
      }
    });
  }

  return (
    <Suspense fallback={null}>
      <ReduxProvider store={store}>
        <Layout
          renderHeader={() => <></>}
          renderContent={CreateVaultPageContent}
          renderFooter={CreateVaultPageFooter}
        />
      </ReduxProvider>
    </Suspense>
  );
}
