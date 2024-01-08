import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import {
  LayoutWindow,
  PopupLayout,
  ResetVaultPageContent,
  UnlockVaultPageContent
} from '@libs/layout';

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
