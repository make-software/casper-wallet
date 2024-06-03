import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { ResetVaultPage } from '@libs/layout/reset-vault';
import { UnlockVaultPage } from '@libs/layout/unlock-vault';

export const LockedRouterPath = {
  Any: '*',
  ResetVault: '/reset-vault'
};

interface LockedRouterProps {
  popupLayout?: boolean;
}

export const LockedRouter = ({ popupLayout }: LockedRouterProps) => (
  <HashRouter>
    <Routes>
      <Route
        path={LockedRouterPath.Any}
        element={<UnlockVaultPage popupLayout={popupLayout} />}
      />
      <Route
        path={LockedRouterPath.ResetVault}
        element={<ResetVaultPage popupLayout={popupLayout} />}
      />
    </Routes>
  </HashRouter>
);
