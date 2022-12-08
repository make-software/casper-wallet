import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { ResetVaultPageContent } from '@src/libs/layout/reset-vault';
import { UnlockVaultPageContent } from '@src/libs/layout/unlock-vault';
import { PopupHeader } from '../header';
import { Layout } from '../layout';

export const LockedRouterPath = {
  Any: '*',
  ResetVault: '/reset-vault'
};

export function LockedRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={LockedRouterPath.Any}
          element={
            <Layout
              renderHeader={() => <PopupHeader />}
              renderContent={() => <UnlockVaultPageContent />}
            />
          }
        />
        <Route
          path={LockedRouterPath.ResetVault}
          element={
            <Layout
              renderHeader={() => <PopupHeader />}
              renderContent={() => <ResetVaultPageContent />}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
