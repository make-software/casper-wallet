import React from 'react';
import { useSelector } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useUserActivityTracker } from '@src/hooks/use-user-activity-tracker';

import { AccountSettingsPage } from '@popup/pages/account-settings';
import { ActivityDetailsPage } from '@popup/pages/activity-details';
import { AddContactPage } from '@popup/pages/add-contact';
import { BackupSecretPhrasePage } from '@popup/pages/backup-secret-phrase';
import { ChangePasswordPage } from '@popup/pages/change-password';
import { ConnectAnotherAccountPageContent } from '@popup/pages/connect-another-account';
import { ConnectedSitesPage } from '@popup/pages/connected-sites';
import { ContactDetailsPage } from '@popup/pages/contact-details';
import { ContactsBookPage } from '@popup/pages/contacts';
import { CreateAccountPage } from '@popup/pages/create-account';
import { DownloadSecretKeysPage } from '@popup/pages/download-secret-keys';
import { DownloadedSecretKeysPage } from '@popup/pages/downloaded-secret-keys';
import { HomePageContent } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
import { NftDetailsPage } from '@popup/pages/nft-details';
import { NoConnectedAccountPageContent } from '@popup/pages/no-connected-account';
import { ReceivePage } from '@popup/pages/receive';
import { RemoveAccountPageContent } from '@popup/pages/remove-account';
import { RenameAccountPageContent } from '@popup/pages/rename-account';
import { StakesPage } from '@popup/pages/stakes';
import { TimeoutPageContent } from '@popup/pages/timeout';
import { TokenDetailPage } from '@popup/pages/token-details';
import { TransferPage } from '@popup/pages/transfer';
import { TransferNftPage } from '@popup/pages/transfer-nft';
import { WalletQrCodePage } from '@popup/pages/wallet-qr-code';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { selectVaultHasAccounts } from '@background/redux/vault/selectors';

import '@libs/i18n/i18n';
import {
  ErrorPath,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  LockedRouter,
  PopupLayout,
  WindowErrorPage
} from '@libs/layout';

export function AppRouter() {
  const isLocked = useSelector(selectVaultIsLocked);
  useUserActivityTracker();

  if (isLocked) {
    return <LockedRouter popupLayout />;
  }

  return (
    <HashRouter>
      <AppRoutes />
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
            <PopupLayout
              renderHeader={() => (
                <HeaderPopup
                  withConnectionStatus
                  withMenu
                  withNetworkSwitcher
                />
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
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup withNetworkSwitcher withMenu withConnectionStatus />
            )}
            renderContent={() => <HomePageContent />}
          />
        }
      />
      <Route path={RouterPath.CreateAccount} element={<CreateAccountPage />} />
      <Route
        path={RouterPath.AccountSettings}
        element={<AccountSettingsPage />}
      />
      <Route
        path={RouterPath.Timeout}
        element={
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup
                withNetworkSwitcher
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
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup
                withNetworkSwitcher
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
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup
                withNetworkSwitcher
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
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup withNetworkSwitcher withMenu withConnectionStatus />
            )}
            renderContent={() => <NoConnectedAccountPageContent />}
          />
        }
      />
      <Route
        path={RouterPath.ConnectedSites}
        element={
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup
                withMenu
                withNetworkSwitcher
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
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup
                withNetworkSwitcher
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
          <PopupLayout
            renderHeader={() => (
              <HeaderPopup
                withNetworkSwitcher
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
      <Route path={RouterPath.Transfer} element={<TransferPage />} />
      <Route
        path={RouterPath.ActivityDetails}
        element={<ActivityDetailsPage />}
      />
      <Route path={RouterPath.Token} element={<TokenDetailPage />} />
      <Route path={RouterPath.Receive} element={<ReceivePage />} />
      <Route path={RouterPath.NftDetails} element={<NftDetailsPage />} />
      <Route
        path={RouterPath.GenerateWalletQRCode}
        element={<WalletQrCodePage />}
      />
      <Route path={RouterPath.TransferNft} element={<TransferNftPage />} />
      <Route
        path={RouterPath.ChangePassword}
        element={<ChangePasswordPage />}
      />
      <Route path={RouterPath.Delegate} element={<StakesPage />} />
      <Route path={RouterPath.Undelegate} element={<StakesPage />} />
      <Route path={RouterPath.Redelegate} element={<StakesPage />} />
      <Route
        path={ErrorPath}
        element={
          <WindowErrorPage
            createTypedLocation={useTypedLocation}
            createTypedNavigate={useTypedNavigate}
          />
        }
      />
      <Route path={RouterPath.ContactList} element={<ContactsBookPage />} />
      <Route path={RouterPath.AddContact} element={<AddContactPage />} />
      <Route
        path={RouterPath.ContactDetails}
        element={<ContactDetailsPage />}
      />
    </Routes>
  );
}
