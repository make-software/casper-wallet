import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { ResetVaultPageContent } from '@src/libs/layout/reset-vault';
import { UnlockVaultPageContent } from '@src/libs/layout/unlock-vault';
import { PopupLayout, LayoutWindow } from '@libs/layout';

import { PopupHeader } from '../header';

export const LockedRouterPath = {
  Any: '*',
  ResetVault: '/reset-vault'
};

interface LockedRouterProps {
  popupLayout?: boolean;
}

export function LockedRouter({ popupLayout }: LockedRouterProps) {
  return (
    <HashRouter>
      <Routes>
        <Route
          path={LockedRouterPath.Any}
          element={
            popupLayout ? (
              <PopupLayout
                renderHeader={() => <PopupHeader />}
                renderContent={() => <UnlockVaultPageContent />}
              />
            ) : (
              <LayoutWindow
                renderHeader={() => <PopupHeader />}
                renderContent={() => <UnlockVaultPageContent />}
              />
            )
          }
        />
        <Route
          path={LockedRouterPath.ResetVault}
          element={
            popupLayout ? (
              <PopupLayout
                renderHeader={() => <PopupHeader />}
                renderContent={() => <ResetVaultPageContent />}
              />
            ) : (
              <LayoutWindow
                renderHeader={() => <PopupHeader />}
                renderContent={() => <ResetVaultPageContent />}
              />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}
