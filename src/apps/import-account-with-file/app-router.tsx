import '@libs/i18n/i18n';

import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import 'mac-scrollbar/dist/mac-scrollbar.css';

import { RouterPath } from './router';

import { ImportAccountWithFilePage } from './pages/import-account-with-file';
import { ImportAccountWithFileSuccessContentPage } from './pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileUploadPage } from './pages/import-account-with-file-upload';
import { PopupHeader, LayoutWindow } from '@src/libs/layout';
import { useUserActivityTracker } from '@src/hooks/use-user-activity-tracker';

export function AppRouter() {
  useUserActivityTracker();

  return (
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.ImportAccountWithFile}
          element={<ImportAccountWithFilePage />}
        />
        <Route
          path={RouterPath.ImportAccountWithFileUpload}
          element={<ImportAccountWithFileUploadPage />}
        />
        <Route
          path={RouterPath.ImportAccountWithFileSuccess}
          element={
            <LayoutWindow
              variant="default"
              renderHeader={() => <PopupHeader />}
              renderContent={() => <ImportAccountWithFileSuccessContentPage />}
            />
          }
        />
        <Route
          path={RouterPath.ImportAccountWithFileFailure}
          element={
            <LayoutWindow
              variant="default"
              renderHeader={() => <PopupHeader />}
              renderContent={() => <ImportAccountWithFileFailureContentPage />}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
