import React from 'react';

import { SignatureRequestPage } from './pages/signature-request';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { RouterPath } from '@src/apps/signature-request/router';
import { ErrorPage } from '@src/apps/signature-request/pages/error';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.SignatureRequest}
          element={<SignatureRequestPage />}
        />
        <Route path={RouterPath.Error} element={<ErrorPage />} />
      </Routes>
    </HashRouter>
  );
}
