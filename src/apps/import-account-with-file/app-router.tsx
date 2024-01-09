import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useUserActivityTracker } from '@hooks/use-user-activity-tracker';

import '@libs/i18n/i18n';
import { HeaderPopup, LayoutWindow } from '@libs/layout';

import { ImportAccountWithFilePage } from './pages/import-account-with-file';
import { ImportAccountWithFileFailureContentPage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileSuccessContentPage } from './pages/import-account-with-file-success';
import { ImportAccountWithFileUploadPage } from './pages/import-account-with-file-upload';
import { RouterPath } from './router';

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
              renderHeader={() => <HeaderPopup />}
              renderContent={() => <ImportAccountWithFileSuccessContentPage />}
            />
          }
        />
        <Route
          path={RouterPath.ImportAccountWithFileFailure}
          element={
            <LayoutWindow
              renderHeader={() => <HeaderPopup />}
              renderContent={() => <ImportAccountWithFileFailureContentPage />}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
