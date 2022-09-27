import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RouterPath } from '@connect-to-app/router';
import { AccountsSelectionPage } from '@src/apps/connect-to-app/pages/accounts-selection';
import { ApproveConnectionPage } from '@src/apps/connect-to-app/pages/approve-connection';
import { ConnectingPage } from '@src/apps/connect-to-app/pages/connecting';

export function App() {
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>(
    []
  );
  const { origin, title } = getSiteRelatedData();

  return (
    <Routes>
      <Route
        path={RouterPath.SelectAccountsToConnect}
        element={
          <AccountsSelectionPage
            selectedAccountNames={selectedAccountNames}
            setSelectedAccountNames={setSelectedAccountNames}
            origin={origin}
            title={title}
          />
        }
      />
      <Route
        path={RouterPath.ApproveConnection}
        element={
          <ApproveConnectionPage
            selectedAccountNames={selectedAccountNames}
            origin={origin}
            title={title}
          />
        }
      />
      <Route path={RouterPath.Connecting} element={<ConnectingPage />} />
    </Routes>
  );
}

function getSiteRelatedData() {
  const searchParams = new URLSearchParams(document.location.search);
  const origin = searchParams.get('origin');

  if (origin == null) {
    throw new Error('Missing origin search param');
  }

  const originName = origin.split('://')[1];
  const title = `Connect with ${originName}`;

  return {
    origin,
    title
  };
}
