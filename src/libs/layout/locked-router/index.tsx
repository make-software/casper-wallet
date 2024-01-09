import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import {
  LayoutWindow,
  PopupLayout,
  ResetVaultPageContent,
  UnlockVaultPageContent
} from '@libs/layout';
import { HeaderPopup } from '@libs/layout/header/header-popup';

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
                renderHeader={() => <HeaderPopup />}
                renderContent={() => <UnlockVaultPageContent />}
              />
            ) : (
              <LayoutWindow
                renderHeader={() => <HeaderPopup />}
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
                renderHeader={() => <HeaderPopup />}
                renderContent={() => <ResetVaultPageContent />}
              />
            ) : (
              <LayoutWindow
                renderHeader={() => <HeaderPopup />}
                renderContent={() => <ResetVaultPageContent />}
              />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}
