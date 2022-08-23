import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';

import { useWindowResizeToSizeFromQuerystring } from '@hooks/use-window-resize-to-size-from-querystring';

import { RouterPath } from '@connect-to-app/router';
import { Layout, Header } from '@connect-to-app/layout';
import { AccountsSelectionPage } from '@connect-to-app/pages/accounts-selection';
import { ApproveConnectionPage } from '@connect-to-app/pages/approve-connection';
import { ConnectingPage } from '@connect-to-app/pages/connecting';

function getSiteRelatedData() {
  const querystring = new URLSearchParams(document.location.search);
  const origin = querystring.get('origin');

  if (origin == null) {
    throw new Error("Origin wasn't found");
  }

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
  useWindowResizeToSizeFromQuerystring();

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
        element={
          <Layout
            Header={<Header />}
            Content={
              <ConnectingPage
                selectedAccountNames={selectedAccountNames}
                origin={origin}
              />
            }
          />
        }
      />
    </Routes>
  );
}
