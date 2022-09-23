import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { RouterPath } from '@connect-to-app/router';
import {
  HeaderSubmenuBarNavLink,
  LayoutWindow,
  PopupHeader
} from '@src/libs/layout';
import { AccountsSelectionPage } from '@connect-to-app/pages/accounts-selection';
import { ApproveConnectionPage } from '@connect-to-app/pages/approve-connection';
import { ConnectingPage } from '@connect-to-app/pages/connecting';

function getSiteRelatedData() {
  const searchParams = new URLSearchParams(document.location.search);
  const origin = searchParams.get('origin');

  if (origin == null) {
    throw new Error('Missing origin search param');
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
  const { origin, headerText } = getSiteRelatedData();

  return (
    <Routes>
      <Route
        path={RouterPath.SelectAccountsToConnect}
        element={
          <LayoutWindow
            Header={
              <PopupHeader
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="cancel" />
                )}
              />
            }
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
            Header={
              <PopupHeader
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            }
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
            Header={<PopupHeader withConnectionStatus />}
            Content={<ConnectingPage />}
          />
        }
      />
    </Routes>
  );
}
