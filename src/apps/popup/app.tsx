import '@libs/i18n/i18n';

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import { Header, Layout } from '@src/layout';
import { CreateVaultPageContent } from '@popup/pages/create-vault';
import { HomePageContent } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
import { NoAccountsPageContent } from '@popup/pages/no-accounts';
import { ResetVaultPageContent } from '@popup/pages/reset-vault';
import { TimeoutPageContent } from '@popup/pages/timeout';
import { UnlockVaultPageContent } from '@popup/pages/unlock-vault';
import {
  ImportAccountContentPage,
  ImportAccountWithFileProcessContentPage
} from '@popup/pages/import-account';

import {
  selectVaultDoesExist,
  selectVaultHasAccount,
  selectVaultIsLocked
} from './redux/vault/selectors';

import { useTypedLocation, useTypedNavigate } from '@src/hooks';

import { useVaultTimeoutController } from './hooks/use-vault-timeout-controller';
import { LocationState, RouterPath } from './router';

export function App() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state as LocationState;

  const vaultIsLocked = useSelector(selectVaultIsLocked);
  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultHasAccount = useSelector(selectVaultHasAccount);

  useVaultTimeoutController();

  // App redirects
  useEffect(() => {
    if (vaultIsLocked && location.pathname !== RouterPath.ResetVault) {
      location.pathname !== RouterPath.UnlockVault &&
        navigate(RouterPath.UnlockVault);
    } else if (!vaultDoesExists) {
      navigate(RouterPath.CreateVault, { replace: true });
    } else if (
      !vaultHasAccount &&
      location.pathname !== RouterPath.ResetVault &&
      location.pathname !== RouterPath.ImportAccount &&
      location.pathname !== RouterPath.ImportAccountWithFile &&
      location.pathname !== RouterPath.ImportAccountWithFileSuccess &&
      location.pathname !== RouterPath.ImportAccountWithFileFailure
    ) {
      navigate(RouterPath.NoAccounts, { replace: true });
    }
  }, [
    location.pathname,
    navigate,
    vaultDoesExists,
    vaultHasAccount,
    vaultIsLocked
  ]);

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
            path={RouterPath.Home}
            element={
              <Layout
                Header={<Header withMenu withLock />}
                Content={<HomePageContent />}
              />
            }
          />
          <Route
            path={RouterPath.ResetVault}
            element={
              <Layout Header={<Header />} Content={<ResetVaultPageContent />} />
            }
          />
          <Route
            path={RouterPath.CreateVault}
            element={
              <Layout
                Header={<Header />}
                Content={<CreateVaultPageContent />}
              />
            }
          />
          <Route
            path={RouterPath.ImportAccount}
            element={
              <Layout
                Header={
                  vaultHasAccount ? (
                    <Header withLock withMenu submenuActionType="back" />
                  ) : (
                    <Header withLock submenuActionType="back" />
                  )
                }
                Content={<ImportAccountContentPage />}
              />
            }
          />
          <Route
            path={RouterPath.ImportAccountWithFile}
            element={
              <Layout
                Header={<Header withLock />}
                Content={<ImportAccountWithFileProcessContentPage />}
              />
            }
          />
          <Route
            path={RouterPath.NoAccounts}
            element={
              <Layout
                Header={<Header withLock />}
                Content={<NoAccountsPageContent />}
              />
            }
          />
          <Route
            path={RouterPath.UnlockVault}
            element={
              <Layout
                Header={<Header />}
                Content={<UnlockVaultPageContent />}
              />
            }
          />
          <Route
            path={RouterPath.Timeout}
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
