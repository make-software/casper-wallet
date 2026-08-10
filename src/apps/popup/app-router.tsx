import React, { Suspense, lazy } from 'react';
import { useSelector } from 'react-redux';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { useUserActivityTracker } from '@src/hooks/use-user-activity-tracker';

import { HomeTabProvider } from '@popup/hooks/use-home-tab';
import { LazyPageFallback } from '@popup/lazy-page-fallback';
// Only the home screen, the navigation menu and the error page are statically
// imported. Everything else is a separate chunk that is parsed the first time
// its route is reached, instead of on every popup open (WALLET-1381).
//
// The home screen is eager because it is what the popup renders on open — a
// lazy boundary there would trade the parse cost for a visible loading state.
// The navigation menu is eager because it is one click away on every screen and
// is cheap. WindowErrorPage is eager so the error route can never itself fail
// to load.
import { HomePageContent } from '@popup/pages/home';
import { NavigationMenuPageContent } from '@popup/pages/navigation-menu';
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

const AccountSettingsPage = lazy(() =>
  import('@popup/pages/account-settings').then(m => ({
    default: m.AccountSettingsPage
  }))
);
const AddContactPage = lazy(() =>
  import('@popup/pages/add-contact').then(m => ({ default: m.AddContactPage }))
);
const AddWatchAccount = lazy(() =>
  import('@popup/pages/add-watch-account').then(m => ({
    default: m.AddWatchAccount
  }))
);
const AllAccountsPage = lazy(() =>
  import('@popup/pages/all-accounts').then(m => ({
    default: m.AllAccountsPage
  }))
);
const BackupSecretPhrasePage = lazy(() =>
  import('@popup/pages/backup-secret-phrase').then(m => ({
    default: m.BackupSecretPhrasePage
  }))
);
const BringWeb3Unlock = lazy(() =>
  import('@popup/pages/bring-web3-unlock').then(m => ({
    default: m.BringWeb3Unlock
  }))
);
const BuyCSPRPage = lazy(() =>
  import('@popup/pages/buy-cspr').then(m => ({ default: m.BuyCSPRPage }))
);
const ChangePasswordPage = lazy(() =>
  import('@popup/pages/change-password').then(m => ({
    default: m.ChangePasswordPage
  }))
);
const ConnectAnotherAccountPageContent = lazy(() =>
  import('@popup/pages/connect-another-account').then(m => ({
    default: m.ConnectAnotherAccountPageContent
  }))
);
const ConnectedSitesPage = lazy(() =>
  import('@popup/pages/connected-sites').then(m => ({
    default: m.ConnectedSitesPage
  }))
);
const ContactDetailsPage = lazy(() =>
  import('@popup/pages/contact-details').then(m => ({
    default: m.ContactDetailsPage
  }))
);
const ContactsBookPage = lazy(() =>
  import('@popup/pages/contacts').then(m => ({ default: m.ContactsBookPage }))
);
const CreateAccountPage = lazy(() =>
  import('@popup/pages/create-account').then(m => ({
    default: m.CreateAccountPage
  }))
);
const DeployDetailsPage = lazy(() =>
  import('@popup/pages/deploy-details').then(m => ({
    default: m.DeployDetailsPage
  }))
);
const DownloadAccountKeysPage = lazy(() =>
  import('@popup/pages/download-account-keys').then(m => ({
    default: m.DownloadAccountKeysPage
  }))
);
const ExpiringCsprNamesPage = lazy(() =>
  import('@popup/pages/expiring-cspr-names').then(m => ({
    default: m.ExpiringCsprNamesPage
  }))
);
const ImportAccountFromLedgerPage = lazy(() =>
  import('@popup/pages/import-account-from-ledger').then(m => ({
    default: m.ImportAccountFromLedgerPage
  }))
);
const ImportAccountFromTorusPage = lazy(() =>
  import('@popup/pages/import-account-from-torus').then(m => ({
    default: m.ImportAccountFromTorusPage
  }))
);
const NftDetailsPage = lazy(() =>
  import('@popup/pages/nft-details').then(m => ({ default: m.NftDetailsPage }))
);
const NoConnectedAccountPage = lazy(() =>
  import('@popup/pages/no-connected-account').then(m => ({
    default: m.NoConnectedAccountPage
  }))
);
const RateAppPage = lazy(() =>
  import('@popup/pages/rate-app').then(m => ({ default: m.RateAppPage }))
);
const ReceivePage = lazy(() =>
  import('@popup/pages/receive').then(m => ({ default: m.ReceivePage }))
);
const RemoveAccountPage = lazy(() =>
  import('@popup/pages/remove-account').then(m => ({
    default: m.RemoveAccountPage
  }))
);
const RenameAccountPage = lazy(() =>
  import('@popup/pages/rename-account').then(m => ({
    default: m.RenameAccountPage
  }))
);
const SignWithLedgerInNewWindowPage = lazy(() =>
  import('@popup/pages/sign-with-ledger-in-new-window').then(m => ({
    default: m.SignWithLedgerInNewWindowPage
  }))
);
const StakesPage = lazy(() =>
  import('@popup/pages/stakes').then(m => ({ default: m.StakesPage }))
);
const TimeoutPageContent = lazy(() =>
  import('@popup/pages/timeout').then(m => ({
    default: m.TimeoutPageContent
  }))
);
const TokenDetailPage = lazy(() =>
  import('@popup/pages/token-details').then(m => ({
    default: m.TokenDetailPage
  }))
);
const TransferPage = lazy(() =>
  import('@popup/pages/transfer').then(m => ({ default: m.TransferPage }))
);
const TransferNftPage = lazy(() =>
  import('@popup/pages/transfer-nft').then(m => ({
    default: m.TransferNftPage
  }))
);
const WalletQrCodePage = lazy(() =>
  import('@popup/pages/wallet-qr-code').then(m => ({
    default: m.WalletQrCodePage
  }))
);

export function AppRouter() {
  const isLocked = useSelector(selectVaultIsLocked);
  useUserActivityTracker();

  if (isLocked) {
    return <LockedRouter popupLayout />;
  }

  return (
    <HashRouter>
      <HomeTabProvider>
        <AppRoutes />
      </HomeTabProvider>
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
    // A single boundary around the route table is enough: react-router drives
    // every navigation through startTransition, so React keeps the current
    // screen on screen while the next route's chunk loads and this fallback
    // only renders when a lazy route is the *first* thing the window mounts.
    <Suspense fallback={<LazyPageFallback />}>
      <Routes>
        <Route
          path={RouterPath.Home}
          element={
            <PopupLayout
              renderHeader={() => (
                <HeaderPopup
                  withNetworkSwitcher
                  withMenu
                  withConnectionStatus
                />
              )}
              renderContent={() => <HomePageContent />}
            />
          }
        />
        <Route
          path={RouterPath.CreateAccount}
          element={<CreateAccountPage />}
        />
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
          element={<RemoveAccountPage />}
        />
        <Route
          path={RouterPath.RenameAccount}
          element={<RenameAccountPage />}
        />
        <Route
          path={RouterPath.NoConnectedAccount}
          element={<NoConnectedAccountPage />}
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
          path={RouterPath.DownloadAccountKeys}
          element={<DownloadAccountKeysPage />}
        />
        <Route path={RouterPath.Transfer} element={<TransferPage />} />
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
        <Route path={RouterPath.RateApp} element={<RateAppPage />} />
        <Route
          path={RouterPath.AllAccountsList}
          element={<AllAccountsPage />}
        />
        <Route
          path={RouterPath.ImportAccountFromTorus}
          element={<ImportAccountFromTorusPage />}
        />
        <Route path={RouterPath.BuyCSPR} element={<BuyCSPRPage />} />
        <Route
          path={RouterPath.ImportAccountFromLedger}
          element={<ImportAccountFromLedgerPage />}
        />
        <Route
          path={RouterPath.SignWithLedgerInNewWindow}
          element={<SignWithLedgerInNewWindowPage />}
        />
        <Route
          path={RouterPath.DeployDetails}
          element={<DeployDetailsPage />}
        />
        <Route
          path={RouterPath.AddWatchAccount}
          element={<AddWatchAccount />}
        />
        <Route
          path={RouterPath.BringWeb3Unlock}
          element={<BringWeb3Unlock />}
        />
        <Route
          path={RouterPath.ExpiringCsprNames}
          element={<ExpiringCsprNamesPage />}
        />
      </Routes>
    </Suspense>
  );
}
