import React from 'react';

import { SignatureRequestPage } from './pages/signature-request';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { ErrorPath, WindowErrorPage } from '@src/libs/layout/error';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@src/apps/signature-request/router';
import { useUserActivityTracker } from '@src/hooks/use-user-activity-tracker';
import { useSelector } from 'react-redux';
import { selectVaultIsLocked } from '@src/background/redux/session/selectors';
import { LockedRouter } from '@src/libs/layout/locked-router';

export function AppRouter() {
  useUserActivityTracker();

  const isLocked = useSelector(selectVaultIsLocked);
  if (isLocked) {
    return <LockedRouter />;
  }

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
            <WindowErrorPage
              createTypedNavigate={useTypedNavigate}
              createTypedLocation={useTypedLocation}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
