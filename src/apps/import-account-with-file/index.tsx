import React from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { RouterPath } from './router';

import { ImportAccountWithFileSuccessContentPage } from './pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileContentPage } from './pages/import-account-with-file';
import { ImportAccountWithFileLayout } from './layout';

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.ImportAccountWithFile}
          element={
            <ImportAccountWithFileLayout
              Content={<ImportAccountWithFileContentPage />}
            />
          }
        />
        <Route
          path={RouterPath.ImportAccountWithFileSuccess}
          element={
            <ImportAccountWithFileLayout
              Content={<ImportAccountWithFileSuccessContentPage />}
            />
          }
        />
        <Route
          path={RouterPath.ImportAccountWithFileFailure}
          element={
            <ImportAccountWithFileLayout
              Content={<ImportAccountWithFileFailureContentPage />}
            />
          }
        />
      </Routes>
    </HashRouter>
  </ThemeProvider>,
  document.querySelector('#import-account-with-file-app-container')
);
