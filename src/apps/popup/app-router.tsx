import '@libs/i18n/i18n';

import React from 'react';
import { useSelector } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { HeaderSubmenuBarNavLink, Layout } from '@libs/layout';
import { PopupHeader } from '@libs/layout/header';

import { HomePageContent, HomePageHeaderSubmenuItems } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
import { TimeoutPageContent } from '@popup/pages/timeout';
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
import { CreateAccountPage } from '@src/apps/popup/pages/create-account';
import { DownloadSecretKeysPage } from '@popup/pages/download-secret-keys';
import { DownloadedSecretKeysPage } from '@popup/pages/downloaded-secret-keys';

import { RouterPath, useTypedLocation } from '@popup/router';

import { selectVaultHasAccounts } from '@background/redux/vault/selectors';

import { useUserActivityTracker } from '@src/hooks/use-user-activity-tracker';
import { selectVaultIsLocked } from '@src/background/redux/session/selectors';
import { selectKeysDoesExist } from '@src/background/redux/keys/selectors';
import { LockedRouter } from '@src/libs/layout/locked-router';

export function AppRouter() {
  const isLocked = useSelector(selectVaultIsLocked);
  useUserActivityTracker();

  if (isLocked) {
    return <LockedRouter />;
  }

  return (
    <HashRouter>
      <AppRoutes />;
    </HashRouter>
  );
}

function AppRoutes() {
  const location = useTypedLocation();
  const state = location.state;

  const keysDoesExist = useSelector(selectKeysDoesExist);
  const vaultHasAccount = useSelector(selectVaultHasAccounts);

  if (!keysDoesExist || !vaultHasAccount) {
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
      <Route path={RouterPath.CreateAccount} element={<CreateAccountPage />} />
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
                  <HeaderSubmenuBarNavLink linkType="back" />
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
      <Route
        path={RouterPath.DownloadSecretKeys}
        element={<DownloadSecretKeysPage />}
      />
      <Route
        path={RouterPath.DownloadedSecretKeys}
        element={<DownloadedSecretKeysPage />}
      />
    </Routes>
  );
}