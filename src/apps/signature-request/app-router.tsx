import React from 'react';
import { useSelector } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useUserActivityTracker } from '@src/hooks/use-user-activity-tracker';

import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@signature-request/router';

import { selectVaultIsLocked } from '@background/redux/session/selectors';

import { ErrorPath, LockedRouter, WindowErrorPage } from '@libs/layout';

import { DecryptMessagePage } from './pages/decrypt-message';
import { SignMessagePage } from './pages/sign-message';
import { SignTransactionPage } from './pages/sign-transaction';

export function AppRouter() {
  useUserActivityTracker();

  const isLocked = useSelector(selectVaultIsLocked);
  if (isLocked) {
    return <LockedRouter />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path={RouterPath.SignDeploy} element={<SignTransactionPage />} />
        <Route path={RouterPath.SignMessage} element={<SignMessagePage />} />
        <Route
          path={RouterPath.DecryptMessage}
          element={<DecryptMessagePage />}
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
