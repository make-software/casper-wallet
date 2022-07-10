import '@libs/i18n/i18n';

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import { Layout } from '@src/layout';

import { CreateVaultPageContent } from '@popup/pages/create-vault';
import { HomePageContent } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
import { NoAccountsPageContent } from '@popup/pages/no-accounts';
import { ResetVaultPageContent } from '@popup/pages/reset-vault';
import { TimeoutPageContent } from '@popup/pages/timeout';
import { UnlockVaultPageContent } from '@popup/pages/unlock-vault';
import { ConnectAnotherAccountPageContent } from '@popup/pages/connect-another-account';

import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { Header } from './layout';

import {
  selectIsActiveAccountConnectedToActiveTab,
  selectVaultDoesExist,
  selectVaultHasAccount,
  selectVaultIsLocked
} from './redux/vault/selectors';

import { useVaultTimeoutController } from './hooks/use-vault-timeout-controller';
import { useActiveTabOrigin } from '@hooks/use-active-tab-origin';

import { useRemoteActions } from './redux/use-remote-actions';
import {
  AccountSettingsPageContent,
  AccountSettingsActionsGroup
} from '@popup/pages/account-settings';
import { RemoveAccountPageContent } from '@popup/pages/remove-account';
import { RenameAccountPageContent } from '@popup/pages/rename-account';
import { RootState } from 'typesafe-actions';

export function App() {
  const navigate = useTypedNavigate();
  const location = useTypedLocation();
  const state = location.state;

  const activeTabOrigin = useActiveTabOrigin({ currentWindow: true });
  const isActiveAccountConnectedToActiveTab = useSelector((state: RootState) =>
    selectIsActiveAccountConnectedToActiveTab(state, activeTabOrigin)
  );

  const vaultIsLocked = useSelector(selectVaultIsLocked);
  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultHasAccount = useSelector(selectVaultHasAccount);

  useVaultTimeoutController();
  useRemoteActions();

  // App redirects
  useEffect(() => {
    if (vaultIsLocked && location.pathname !== RouterPath.ResetVault) {
      location.pathname !== RouterPath.UnlockVault &&
        navigate(RouterPath.UnlockVault);
    } else if (!vaultDoesExists) {
      navigate(RouterPath.CreateVault, { replace: true });
    } else if (
      !vaultHasAccount &&
      location.pathname !== RouterPath.ResetVault
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
                Header={
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
                    withMenu
                    withLock
                  />
                }
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
                Header={
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
                    withMenu
                    withLock
                  />
                }
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
            path={RouterPath.AccountSettings}
            element={
              <Layout
                Header={
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
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
            path={RouterPath.RemoveAccount}
            element={
              <Layout
                Header={
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
                    withLock
                    withMenu
                    submenuActionType="back"
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
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
                    withLock
                    withMenu
                    submenuActionType="back"
                  />
                }
                Content={<RenameAccountPageContent />}
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
                Header={
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
                    submenuActionType="close"
                    withMenu
                    withLock
                  />
                }
                Content={<TimeoutPageContent />}
              />
            }
          />
          <Route
            path={RouterPath.ConnectAnotherAccount}
            element={
              <Layout
                Header={
                  <Header
                    isActiveAccountConnectedToActiveTab={
                      isActiveAccountConnectedToActiveTab
                    }
                    withLock
                    withMenu
                    submenuActionType="cancel"
                  />
                }
                Content={<ConnectAnotherAccountPageContent />}
              />
            }
          />
        </Route>
      )}
    </Routes>
  );
}
