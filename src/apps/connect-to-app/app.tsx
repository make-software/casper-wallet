import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { HeaderWindow_TO_BE_REMOVED, LayoutWindow } from '~src/libs/layout';

import { AccountsSelectionPage } from './pages/accounts-selection';
import { ApproveConnectionPage } from './pages/approve-connection';
import { ConnectingPage } from './pages/connecting';
import { RouterPath } from './router';

function getSiteRelatedData() {
  const origin = document.location.search.split('origin=')[1];
  const originName = origin.split('://')[1];
  const splittedOrigin = originName.split('.');
  const capitalizedOrigin = splittedOrigin
    .map((word, index) =>
      index === splittedOrigin.length - 2 ? word.toUpperCase() : word
    )
    .join('.');

  return {
    origin,
    headerText: `Connect with ${capitalizedOrigin}`
  };
}

export function App() {
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>(
    []
  );
  const { origin, headerText } = getSiteRelatedData();

  return (
    <Routes>
      <Route
        path={RouterPath.SelectAccountsToConnect}
        element={
          <LayoutWindow
            Header={<HeaderWindow_TO_BE_REMOVED submenuActionType="cancel" />}
            Content={
              <AccountsSelectionPage
                selectedAccountNames={selectedAccountNames}
                setSelectedAccountNames={setSelectedAccountNames}
                origin={origin}
                headerText={headerText}
              />
            }
          />
        }
      />
      <Route
        path={RouterPath.ApproveConnection}
        element={
          <LayoutWindow
            Header={<HeaderWindow_TO_BE_REMOVED submenuActionType="back" />}
            Content={
              <ApproveConnectionPage
                selectedAccountNames={selectedAccountNames}
                origin={origin}
                headerText={headerText}
              />
            }
          />
        }
      />
      <Route
        path={RouterPath.Connecting}
        element={
          <LayoutWindow
            Header={<HeaderWindow_TO_BE_REMOVED />}
            Content={<ConnectingPage />}
          />
        }
      />
    </Routes>
  );
}
