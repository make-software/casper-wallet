import './i18n';

import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
// import browser from 'webextension-polyfill';

import { Layout, Header } from '@src/layout';

import { CreateVaultPageContent } from '@src/pages/create-vault';
import { NoAccountsPageContent } from '@src/pages/no-accounts';
import { UnlockVaultPageContent } from '@src/pages/unlock-vault';
import { TimeoutPageContent } from '@src/pages/timeout';
import { HomePageContent } from '@src/pages/home';
import { NavigationMenuPageContent } from '@src/pages/navigation-menu';

import { RouterPaths as RoutePath } from './router/paths';
import { useSelector } from 'react-redux';
import {
  selectVaultHasAccount,
  selectVaultDoesExist,
  selectVaultIsLocked
} from '@src/redux/vault/selectors';

import { useTypedLocation } from './router';
import { useLockVaultTimeout } from '@src/app/hooks/useLockVaultTimeout';

export function App() {
  const navigate = useNavigate();
  const location = useTypedLocation();
  const state = location.state;

  const vaultIsLocked = useSelector(selectVaultIsLocked);
  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultHasAccount = useSelector(selectVaultHasAccount);

  useLockVaultTimeout();

  // App redirects
  useEffect(() => {
    if (vaultIsLocked) {
      navigate(RoutePath.UnlockVault);
    } else if (!vaultDoesExists) {
      navigate(RoutePath.CreateVault, { replace: true });
    } else if (!vaultHasAccount) {
      navigate(RoutePath.NoAccounts, { replace: true });
    }
    // `location.pathname` is needed as a dependency to enable vault and account checking for each route.
    // For the first time it was necessary to make a secure click on the logo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, vaultDoesExists, vaultHasAccount, vaultIsLocked]);

  return (
    <Routes>
      {state?.showNavigationMenu ? (
        <Route>
          <Route
            path="*"
            element={
              <Layout
                Header={<Header withMenu withLock />}
                Content={<NavigationMenuPageContent />}
              />
            }
          />
        </Route>
      ) : (
        <Route>
          <Route
            path={RoutePath.Home}
            element={
              <Layout
                Header={<Header withMenu withLock />}
                Content={<HomePageContent />}
              />
            }
          />
          <Route
            path={RoutePath.CreateVault}
            element={
              <Layout
                Header={<Header />}
                Content={<CreateVaultPageContent />}
              />
            }
          />
          <Route
            path={RoutePath.NoAccounts}
            element={
              <Layout
                Header={<Header withLock />}
                Content={<NoAccountsPageContent />}
              />
            }
          />
          <Route
            path={RoutePath.UnlockVault}
            element={
              <Layout
                Header={<Header />}
                Content={<UnlockVaultPageContent />}
              />
            }
          />
          <Route
            path={RoutePath.Timeout}
            element={
              <Layout
                Header={<Header submenuActionType="close" withMenu withLock />}
                Content={<TimeoutPageContent />}
              />
            }
          />
        </Route>
      )}
    </Routes>
  );
}
