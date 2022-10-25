import '@libs/i18n/i18n';

import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import { HeaderSubmenuBarNavLink, Layout } from '@libs/layout';
import { PopupHeader } from '@libs/layout/header';

import { HomePageContent, HomePageHeaderSubmenuItems } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
import { ResetVaultPageContent } from '@popup/pages/reset-vault';
import { TimeoutPageContent } from '@popup/pages/timeout';
import { UnlockVaultPageContent } from '@popup/pages/unlock-vault';
import { ConnectAnotherAccountPageContent } from '@popup/pages/connect-another-account';
import { NoConnectedAccountPageContent } from '@popup/pages/no-connected-account';
import { ConnectedSitesPage } from '@popup/pages/connected-sites';
import {
  AccountSettingsPageContent,
  AccountSettingsActionsGroup
} from '@popup/pages/account-settings';
import { RemoveAccountPageContent } from '@popup/pages/remove-account';
import { RenameAccountPageContent } from '@popup/pages/rename-account';
import { AccountListPage } from '@popup/pages/account-list';
import { BackupSecretPhrasePage } from '@popup/pages/backup-secret-phrase';
import { CreateNewAccountPage } from '@popup/pages/create-new-account';

import { RouterPath, useTypedLocation } from '@popup/router';

import {
  selectVaultDoesExist,
  selectVaultHasAccount,
  selectVaultIsLocked
} from '@background/redux/vault/selectors';

import { useVaultTimeoutController } from './hooks/use-vault-timeout-controller';

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
            renderHeader={() => <PopupHeader />}
            renderContent={() => <UnlockVaultPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ResetVault}
        element={
          <Layout
            renderHeader={() => <PopupHeader />}
            renderContent={() => <ResetVaultPageContent />}
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

  if (!vaultDoesExists || !vaultHasAccount) {
    return null;
  }

  if (state?.showNavigationMenu) {
    return (
      <Routes>
        <Route
          path={RouterPath.Any}
          element={
            <Layout
              renderHeader={() => (
                <PopupHeader withConnectionStatus withMenu withLock />
              )}
              renderContent={() => <NavigationMenuPageContent />}
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
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HomePageHeaderSubmenuItems linkType="switchAccount" />
                )}
              />
            )}
            renderContent={() => <HomePageContent />}
          />
        }
      />
      <Route
        path={RouterPath.AccountList}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HomePageHeaderSubmenuItems linkType="done" />
                )}
              />
            )}
            renderContent={() => <AccountListPage />}
          />
        }
      />
      <Route
        path={RouterPath.CreateNewAccount}
        element={<CreateNewAccountPage />}
      />
      <Route
        path={RouterPath.AccountSettings}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <>
                    <HeaderSubmenuBarNavLink linkType="close" />
                    <AccountSettingsActionsGroup />
                  </>
                )}
              />
            )}
            renderContent={() => <AccountSettingsPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.Timeout}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="close" />
                )}
              />
            )}
            renderContent={() => <TimeoutPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.RemoveAccount}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            )}
            renderContent={() => <RemoveAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.RenameAccount}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            )}
            renderContent={() => <RenameAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.NoConnectedAccount}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader withLock withMenu withConnectionStatus />
            )}
            renderContent={() => <NoConnectedAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectedSites}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withMenu
                withLock
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            )}
            renderContent={() => <ConnectedSitesPage />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectAnotherAccount}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="cancel" />
                )}
              />
            )}
            renderContent={() => <ConnectAnotherAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectAnotherAccountByParams}
        element={
          <Layout
            renderHeader={() => (
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="cancel" />
                )}
              />
            )}
            renderContent={() => <ConnectAnotherAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.BackupSecretPhrase}
        element={<BackupSecretPhrasePage />}
      />
    </Routes>
  );
}
