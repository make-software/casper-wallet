import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { RouterPath } from '@src/apps/connect-to-app/router';
import { AccountsSelectionPage } from '@src/apps/connect-to-app/pages/accounts-selection';
import { ApproveConnectionPage } from '@src/apps/connect-to-app/pages/approve-connection';
import { ConnectingPage } from '@src/apps/connect-to-app/pages/connecting';

export function App() {
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>(
    []
  );
  const { origin, title } = useSiteRelatedData();

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

function useSiteRelatedData() {
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(document.location.search);
  const origin = searchParams.get('origin');
  const siteTitle = searchParams.get('title');

  if (origin == null) {
    throw new Error('Missing origin search param');
  }

  const connectWith = t('Connect with');
  const title = `${connectWith} ${
    siteTitle != null ? siteTitle : origin.split('://')[1]
  }`;

  return {
    origin,
    title
  };
}
