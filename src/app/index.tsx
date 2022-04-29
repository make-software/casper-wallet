import './i18n';

import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
// import browser from 'webextension-polyfill';

import { Layout, Header } from '@src/layout';

import { CreateVaultPageContent } from '@src/pages/create-vault';
import { NoAccountsPageContent } from '@src/pages/no-accounts';
import { UnlockVaultPageContent } from '@src/pages/unlock-vault';
import { TimeoutPageContent } from '@src/pages/timeout';
import { HomePageContent } from '@src/pages/home';
import { ResetVaultPageContent } from '@src/pages/reset-vault';

import { Routes as RoutePath } from './routes';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsAccountCreated,
  selectIsVaultCreated,
  selectIsVaultLocked,
  selectTimeout,
  selectTimeoutStartFrom
} from '@src/redux/vault/selectors';
import { useAppRedirects, useTimeoutLocking } from './hooks';

export function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isVaultLocked = useSelector(selectIsVaultLocked);
  const isAccountExists = useSelector(selectIsAccountCreated);
  const isVaultExists = useSelector(selectIsVaultCreated);
  const timeout = useSelector(selectTimeout);
  const timeoutStartFrom = useSelector(selectTimeoutStartFrom);

  useTimeoutLocking({
    dispatch,
    timeout,
    timeoutStartFrom,
    isVaultLocked,
    isVaultExists
  });

  useAppRedirects({
    navigate,
    isAccountExists,
    isVaultExists,
    isVaultLocked
  });

  return (
    <Routes>
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
          <Layout Header={<Header />} Content={<CreateVaultPageContent />} />
        }
      />
      <Route
        path={RoutePath.NoAccounts}
        element={
          <Layout
            Header={<Header withMenu withLock />}
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
            Header={<Header navBarLink="close" withMenu withLock />}
            Content={<TimeoutPageContent />}
          />
        }
      />
      <Route
        path={RoutePath.ResetVault}
        element={
          <Layout Header={<Header />} Content={<ResetVaultPageContent />} />
        }
      />
    </Routes>
  );
}
