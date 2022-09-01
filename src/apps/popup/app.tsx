import '@libs/i18n/i18n';

import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import { Layout } from '@src/libs/layout';

import { CreateVaultPageContent } from '@popup/pages/create-vault';
import { HomePageContent } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
import { NoAccountsPageContent } from '@popup/pages/no-accounts';
import { ResetVaultPageContent } from '@popup/pages/reset-vault';
import { TimeoutPageContent } from '@popup/pages/timeout';
import { UnlockVaultPageContent } from '@popup/pages/unlock-vault';
import { ConnectAnotherAccountPageContent } from '@popup/pages/connect-another-account';
import { NoConnectedAccountPageContent } from '@popup/pages/no-connected-account';
import { ConnectedSitesPage } from '@popup/pages/connected-sites';

import { RouterPath, useTypedLocation } from '@popup/router';

import {
  selectVaultDoesExist,
  selectVaultHasAccount,
  selectVaultIsLocked
} from '../../background/redux/vault/selectors';

import { useVaultTimeoutController } from './hooks/use-vault-timeout-controller';

import {
  AccountSettingsPageContent,
  AccountSettingsActionsGroup
} from '@popup/pages/account-settings';
import { RemoveAccountPageContent } from '@popup/pages/remove-account';
import { RenameAccountPageContent } from '@popup/pages/rename-account';
import { PopupHeader } from '@src/libs/layout/header';

export function App() {
  const vaultIsLocked = useSelector(selectVaultIsLocked);
  useVaultTimeoutController();

  if (vaultIsLocked) {
    return <LockedRouter />;
  }

  return <UnlockedRouter />;
}

function LockedRouter() {
  return (
    <Routes>
      <Route
        path={RouterPath.Any}
        element={
          <Layout
            Header={<PopupHeader />}
            Content={<UnlockVaultPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ResetVault}
        element={
          <Layout
            Header={<PopupHeader />}
            Content={<ResetVaultPageContent />}
          />
        }
      />
    </Routes>
  );
}

function UnlockedRouter() {
  const location = useTypedLocation();
  const state = location.state;

  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultHasAccount = useSelector(selectVaultHasAccount);

  if (!vaultDoesExists) {
    return (
      <Routes>
        <Route
          path={RouterPath.Any}
          element={
            <Layout
              Header={<PopupHeader />}
              Content={<CreateVaultPageContent />}
            />
          }
        />
      </Routes>
    );
  }

  if (!vaultHasAccount) {
    return (
      <Routes>
        <Route
          path={RouterPath.Any}
          element={
            <Layout
              Header={<PopupHeader withLock />}
              Content={<NoAccountsPageContent />}
            />
          }
        />
      </Routes>
    );
  }

  if (state?.showNavigationMenu) {
    return (
      <Routes>
        <Route
          path={RouterPath.Any}
          element={
            <Layout
              Header={<PopupHeader withMenu withLock />}
              Content={<NavigationMenuPageContent />}
            />
          }
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path={RouterPath.Home}
        element={
          <Layout
            Header={<PopupHeader withMenu withLock />}
            Content={<HomePageContent />}
          />
        }
      />
      <Route
        path={RouterPath.AccountSettings}
        element={
          <Layout
            Header={
              <PopupHeader
                withLock
                withMenu
                submenuActionType="close"
                SubmenuActionGroup={<AccountSettingsActionsGroup />}
              />
            }
            Content={<AccountSettingsPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.Timeout}
        element={
          <Layout
            Header={<PopupHeader submenuActionType="close" withMenu withLock />}
            Content={<TimeoutPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.RemoveAccount}
        element={
          <Layout
            Header={<PopupHeader withLock withMenu submenuActionType="back" />}
            Content={<RemoveAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.RenameAccount}
        element={
          <Layout
            Header={<PopupHeader withLock withMenu submenuActionType="back" />}
            Content={<RenameAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.NoConnectedAccount}
        element={
          <Layout
            Header={<PopupHeader withLock withMenu />}
            Content={<NoConnectedAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectAnotherAccount}
        element={
          <Layout
            Header={
              <PopupHeader withLock withMenu submenuActionType="cancel" />
            }
            Content={<ConnectAnotherAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectedSites}
        element={
          <Layout
            Header={<PopupHeader submenuActionType="back" withMenu withLock />}
            Content={<ConnectedSitesPage />}
          />
        }
      />
      <Route
        path={RouterPath.SigningRequest}
        element={
          <Layout
            Header={<PopupHeader withLock withMenu />}
            Content={<SignatureRequestPage request={transferData} />}
          />
        }
      />
    </Routes>
  );
}
