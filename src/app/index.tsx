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
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsAccountCreated,
  selectIsVaultCreated,
  selectIsVaultLocked,
  selectTimeout,
  selectTimeoutStartFrom
} from '@src/redux/vault/selectors';
import { TimeoutValue } from '@src/app/types';
import { clearTimeout, lockVault } from '@src/redux/vault/actions';

export function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isVaultLocked = useSelector(selectIsVaultLocked);
  const isVaultExists = useSelector(selectIsVaultCreated);
  const isAccountExists = useSelector(selectIsAccountCreated);
  const timeout = useSelector(selectTimeout);
  const timeoutStartFrom = useSelector(selectTimeoutStartFrom);

  // App redirects
  useEffect(() => {
    if (isVaultLocked) {
      navigate(RoutePath.UnlockVault);
    } else if (!isVaultExists) {
      navigate(RoutePath.CreateVault);
    } else if (!isAccountExists) {
      navigate(RoutePath.NoAccounts);
    }
  }, [isVaultLocked, isVaultExists, isAccountExists]);

  // Timer of locking app
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentTime = Date.now();

    if (isVaultExists && !isVaultLocked && timeoutStartFrom) {
      // Check up on opening popup
      if (currentTime - timeoutStartFrom >= TimeoutValue[timeout]) {
        dispatch(lockVault());
        dispatch(clearTimeout());
      } else {
        // Check up for opened popup
        interval = setInterval(() => {
          currentTime = Date.now();

          if (
            !isVaultLocked &&
            timeoutStartFrom &&
            currentTime - timeoutStartFrom >= TimeoutValue[timeout]
          ) {
            clearInterval(interval);
            dispatch(lockVault());
            dispatch(clearTimeout());
          }
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [dispatch, isVaultLocked, isVaultExists, timeoutStartFrom, timeout]);

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
    </Routes>
  );
}
