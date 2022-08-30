import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RouterPath } from '@connect-to-app/router';
import { Layout, Header } from '@layout/window';
import { AccountsSelectionPage } from '@connect-to-app/pages/accounts-selection';
import { ApproveConnectionPage } from '@connect-to-app/pages/approve-connection';
import { ConnectingPage } from '@connect-to-app/pages/connecting';

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
          <Layout
            Header={<Header submenuActionType="cancel" />}
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
          <Layout
            Header={<Header submenuActionType="back" />}
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
        element={<Layout Header={<Header />} Content={<ConnectingPage />} />}
      />
    </Routes>
  );
}
