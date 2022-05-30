import React from 'react';
import { render } from 'react-dom';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { Header, Layout } from '@src/layout';
import { REDUX_STORAGE_KEY } from '@libs/services/constants';
import { GlobalStyle, themeConfig } from '@libs/ui';

import { RouterPath } from '@import-account-with-file/paths';
import { ImportAccountWithFileSuccessContentPage } from '@import-account-with-file/pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from '@import-account-with-file/pages/import-account-with-file-failure';
import { ImportAccountWithFileContentPage } from '@import-account-with-file/pages/import-account-with-file';

import { createStore } from '@popup/redux';

const reduxStorageState = JSON.parse(
  localStorage.getItem(REDUX_STORAGE_KEY) || '{}'
);
const store = createStore(reduxStorageState);

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <ReduxProvider store={store}>
      <HashRouter>
        <Routes>
          <Route
            path={RouterPath.ImportAccountWithFile}
            element={
              <Layout
                Header={<Header />}
                Content={<ImportAccountWithFileContentPage />}
              />
            }
          />
          <Route
            path={RouterPath.ImportAccountWithFileSuccess}
            element={
              <Layout
                Header={<Header />}
                Content={<ImportAccountWithFileSuccessContentPage />}
              />
            }
          />
          <Route
            path={RouterPath.ImportAccountWithFileFailure}
            element={
              <Layout
                Header={<Header />}
                Content={<ImportAccountWithFileFailureContentPage />}
              />
            }
          />
        </Routes>
      </HashRouter>
    </ReduxProvider>
  </ThemeProvider>,
  document.querySelector('#import-account-with-file-app-container')
);
