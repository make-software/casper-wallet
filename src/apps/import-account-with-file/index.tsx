import '@libs/i18n/i18n';

import React, { Suspense } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalScrollbar } from 'mac-scrollbar';
import { HashRouter, Route, Routes } from 'react-router-dom';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { GlobalStyle, themeConfig } from '@libs/ui';

import { RouterPath } from './router';

import { ImportAccountWithFileSuccessContentPage } from './pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileContentPage } from './pages/import-account-with-file';
import { PopupHeader, LayoutWindow } from '@src/libs/layout';

render(
  <Suspense fallback={null}>
    <ThemeProvider theme={themeConfig}>
      <GlobalStyle />
      <GlobalScrollbar />
      <HashRouter>
        <Routes>
          <Route
            path={RouterPath.ImportAccountWithFile}
            element={
              <LayoutWindow
                Header={<PopupHeader />}
                Content={<ImportAccountWithFileContentPage />}
              />
            }
          />
          <Route
            path={RouterPath.ImportAccountWithFileSuccess}
            element={
              <LayoutWindow
                Header={<PopupHeader />}
                Content={<ImportAccountWithFileSuccessContentPage />}
              />
            }
          />
          <Route
            path={RouterPath.ImportAccountWithFileFailure}
            element={
              <LayoutWindow
                Header={<PopupHeader />}
                Content={<ImportAccountWithFileFailureContentPage />}
              />
            }
          />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  </Suspense>,
  document.querySelector('#import-account-with-file-app-container')
);
