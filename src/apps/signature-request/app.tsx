import React from 'react';

import { SignatureRequestPage } from './pages/signature-request';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { ErrorPath, ErrorPage } from '@src/libs/layout/error';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@src/apps/signature-request/router';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={RouterPath.SignatureRequest}
          element={<SignatureRequestPage />}
        />
        <Route
          path={ErrorPath}
          element={
            <ErrorPage
              createTypedNavigate={useTypedNavigate}
              createTypedLocation={useTypedLocation}
              layoutType="window"
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
