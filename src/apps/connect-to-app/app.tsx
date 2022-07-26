import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RouterPath } from '@connect-to-app/router';
import { Layout, Header } from '@connect-to-app/layout';
import { SelectAccountsToConnectPageContent } from '@connect-to-app/pages/select-accounts-to-connect';
import { PreConnectPageContent } from '@connect-to-app/pages/preconnect';
import { ConnectionPageContent } from '@connect-to-app/pages/connection';

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
              <SelectAccountsToConnectPageContent
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
        path={RouterPath.PreConnect}
        element={
          <Layout
            Header={<Header submenuActionType="back" />}
            Content={
              <PreConnectPageContent
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
              <ConnectionPageContent
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
