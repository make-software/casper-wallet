import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RouterPath } from '@connect-to-app/router';
import { Layout, Header } from '@connect-to-app/layout';
import { SelectAccountsToConnectPage } from '@connect-to-app/pages/select-accounts-to-connect';
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
    faviconUrl: `${origin}/favicon.ico`,
    originName,
    headerText: `Connect with ${capitalizedOrigin}`
  };
}

export function App() {
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>(
    []
  );
  const { origin, originName, headerText, faviconUrl } = getSiteRelatedData();

  return (
    <Routes>
      <Route
        path={RouterPath.SelectAccountsToConnect}
        element={
          <Layout
            Header={<Header submenuActionType="cancel" />}
            Content={
              <SelectAccountsToConnectPage
                selectedAccountNames={selectedAccountNames}
                setSelectedAccountNames={setSelectedAccountNames}
                faviconUrl={faviconUrl}
                originName={originName}
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
                faviconUrl={faviconUrl}
                originName={originName}
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
                faviconUrl={faviconUrl}
                origin={origin}
              />
            }
          />
        }
      />
    </Routes>
  );
}
