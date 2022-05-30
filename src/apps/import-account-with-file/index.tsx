import React, { ElementType } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { Layout } from '@src/layout';
import { GlobalStyle, themeConfig } from '@libs/ui';

import { Header } from './layout';
import { RouterPath } from './router';

import { ImportAccountWithFileSuccessContentPage } from './pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileContentPage } from './pages/import-account-with-file';

interface ImportAccountWithFileLayoutProps {
  Content: ElementType;
}

function ImportAccountWithFileLayout({
  Content
}: ImportAccountWithFileLayoutProps) {
  return <Layout Header={<Header />} Content={<Content />} />;
}

render(
  <ThemeProvider theme={themeConfig}>
    <GlobalStyle />
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.ImportAccountWithFile}
          element={
            <ImportAccountWithFileLayout
              Content={ImportAccountWithFileContentPage}
            />
          }
        />
        <Route
          path={RouterPath.ImportAccountWithFileSuccess}
          element={
            <ImportAccountWithFileLayout
              Content={ImportAccountWithFileSuccessContentPage}
            />
          }
        />
        <Route
          path={RouterPath.ImportAccountWithFileFailure}
          element={
            <ImportAccountWithFileLayout
              Content={ImportAccountWithFileFailureContentPage}
            />
          }
        />
      </Routes>
    </HashRouter>
  </ThemeProvider>,
  document.querySelector('#import-account-with-file-app-container')
);
