import '@libs/i18n/i18n';

import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { RouterPath } from './router';

import { ImportAccountWithFileSuccessContentPage } from './pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileContentPage } from './pages/import-account-with-file';
import { PopupHeader, LayoutWindow } from '@src/libs/layout';

export function AppRouter() {
  return (
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
  );
}
