import '@libs/i18n/i18n';

import React from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import { HeaderSubmenuBarNavLink, Layout } from '@src/libs/layout';

import { CreateVaultPageContent } from '@popup/pages/create-vault';
import { HomePageContent, HomePageHeaderSubmenuItems } from '@popup/pages/home';
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
import { AccountListPage } from '@popup/pages/account-list';
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
              Header={<PopupHeader withConnectionStatus withMenu withLock />}
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
            Header={
              <PopupHeader
                withMenu
                withLock
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HomePageHeaderSubmenuItems linkType="switchAccount" />
                )}
              />
            }
            Content={<HomePageContent />}
          />
        }
      />
      <Route
        path={RouterPath.AccountList}
        element={
          <Layout
            Header={
              <PopupHeader
                withLock
                withMenu
                renderSubmenuBarItems={() => (
                  <HomePageHeaderSubmenuItems linkType="done" />
                )}
              />
            }
            Content={<AccountListPage />}
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
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <>
                    <HeaderSubmenuBarNavLink linkType="close" />
                    <AccountSettingsActionsGroup />
                  </>
                )}
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
            Header={
              <PopupHeader
                withConnectionStatus
                withMenu
                withLock
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="close" />
                )}
              />
            }
            Content={<TimeoutPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.RemoveAccount}
        element={
          <Layout
            Header={
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            }
            Content={<RemoveAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.RenameAccount}
        element={
          <Layout
            Header={
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            }
            Content={<RenameAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.NoConnectedAccount}
        element={
          <Layout
            Header={<PopupHeader withLock withMenu withConnectionStatus />}
            Content={<NoConnectedAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectAnotherAccount}
        element={
          <Layout
            Header={
              <PopupHeader
                withLock
                withMenu
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="cancel" />
                )}
              />
            }
            Content={<ConnectAnotherAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectedSites}
        element={
          <Layout
            Header={
              <PopupHeader
                withMenu
                withLock
                withConnectionStatus
                renderSubmenuBarItems={() => (
                  <HeaderSubmenuBarNavLink linkType="back" />
                )}
              />
            }
            Content={<ConnectedSitesPage />}
          />
        }
      />
    </Routes>
  );
}
