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

import { Routes as RoutePath } from './routes';
import { useSelector } from 'react-redux';
import {
  selectIsAccountCreated,
  selectIsVaultCreated,
  selectIsVaultLocked
} from '@src/redux/vault/selectors';

export function App() {
  const isVaultLocked = useSelector(selectIsVaultLocked);
  const isAccountExists = useSelector(selectIsAccountCreated);
  const isVaultExists = useSelector(selectIsVaultCreated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isVaultLocked) {
      navigate(RoutePath.UnlockVault);
    } else if (!isVaultExists) {
      navigate(RoutePath.CreateVault);
    } else if (!isAccountExists) {
      navigate(RoutePath.NoAccounts);
    }
  }, [isVaultLocked, isVaultExists, isAccountExists]);

  return (
    <Routes>
      <Route
        path={RoutePath.Home}
        element={
          <Layout
            Header={<Header withMenu withLockButton />}
            Content={<HomePageContent />}
          />
        }
      />
      <Route
        path={RoutePath.CreateVault}
        element={
          <Layout Header={<Header />} Content={<CreateVaultPageContent />} />
        }
      />
      <Route
        path={RoutePath.NoAccounts}
        element={
          <Layout
            Header={<Header withMenu withLockButton />}
            Content={<NoAccountsPageContent />}
          />
        }
      />
      <Route
        path={RoutePath.UnlockVault}
        element={
          <Layout Header={<Header />} Content={<UnlockVaultPageContent />} />
        }
      />
      <Route
        path={RoutePath.Timeout}
        element={
          <Layout
            Header={<Header subHeaderLink="close" withLockButton />}
            Content={<TimeoutPageContent />}
          />
        }
      />
    </Routes>
  );
}
