import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useWindowResizeToSizeFromQuerystring } from '@hooks/use-window-resize-to-size-from-querystring';

import { RouterPath } from '@import-account-with-file/router';
import { ImportAccountWithFileLayout } from '@import-account-with-file/layout';

import { ImportAccountWithFileContentPage } from '@import-account-with-file/pages/import-account-with-file';
import { ImportAccountWithFileSuccessContentPage } from '@import-account-with-file/pages/import-account-with-file-success';
import { ImportAccountWithFileFailureContentPage } from '@import-account-with-file/pages/import-account-with-file-failure';

export function App() {
  useWindowResizeToSizeFromQuerystring();

  return (
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
  );
}
