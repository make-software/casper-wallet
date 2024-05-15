import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useUserActivityTracker } from '@hooks/use-user-activity-tracker';

import '@libs/i18n/i18n';

import { ImportAccountWithFilePage } from './pages/import-account-with-file';
import { ImportAccountWithFileFailurePage } from './pages/import-account-with-file-failure';
import { ImportAccountWithFileSuccessPage } from './pages/import-account-with-file-success';
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
          element={<ImportAccountWithFileSuccessPage />}
        />
        <Route
          path={RouterPath.ImportAccountWithFileFailure}
          element={<ImportAccountWithFileFailurePage />}
        />
      </Routes>
    </HashRouter>
  );
}
