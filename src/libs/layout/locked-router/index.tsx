import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { ResetVaultPageContent } from '@src/libs/layout/reset-vault';
import { UnlockVaultPageContent } from '@src/libs/layout/unlock-vault';
import { PopupHeader } from '../header';
import { PopupLayout } from '../popup-layout';

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
            <PopupLayout
              renderHeader={() => <PopupHeader />}
              renderContent={() => <UnlockVaultPageContent />}
            />
          }
        />
        <Route
          path={LockedRouterPath.ResetVault}
          element={
            <PopupLayout
              renderHeader={() => <PopupHeader />}
              renderContent={() => <ResetVaultPageContent />}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
