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
import { MenuPageContent } from '@src/pages/menu';

import { Routes as RoutePath } from './routes';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectIsAccountCreated,
  selectIsVaultCreated,
  selectIsVaultLocked,
  selectTimeoutDuration,
  selectTimeoutStartTime
} from '@src/redux/vault/selectors';
import { TimeoutValue } from '@src/app/types';
import { lockVault } from '@src/redux/vault/actions';

export function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isVaultLocked = useSelector(selectIsVaultLocked);
  const isVaultExists = useSelector(selectIsVaultCreated);
  const isAccountExists = useSelector(selectIsAccountCreated);
  const timeoutDuration = useSelector(selectTimeoutDuration);
  const timeoutStartTime = useSelector(selectTimeoutStartTime);

  // App redirects
  useEffect(() => {
    if (isVaultLocked) {
      navigate(RoutePath.UnlockVault);
    } else if (!isVaultExists) {
      navigate(RoutePath.CreateVault);
    } else if (!isAccountExists) {
      navigate(RoutePath.NoAccounts);
    }
  }, [isVaultExists, isAccountExists, isVaultLocked]);

  // Timer of locking app
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentTime = Date.now();

    if (isVaultExists && !isVaultLocked && timeoutStartTime) {
      // Check up on opening popup
      if (currentTime - timeoutStartTime >= TimeoutValue[timeoutDuration]) {
        dispatch(lockVault());
      } else {
        // Check up for opened popup
        interval = setInterval(() => {
          currentTime = Date.now();

          if (
            !isVaultLocked &&
            timeoutStartTime &&
            currentTime - timeoutStartTime >= TimeoutValue[timeoutDuration]
          ) {
            clearInterval(interval);
            dispatch(lockVault());
          }
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [
    dispatch,
    isVaultExists,
    isVaultLocked,
    timeoutStartTime,
    timeoutDuration
  ]);

  return (
    <Routes>
      <Route
        index
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
        path={RoutePath.Menu}
        element={
          <Layout
            Header={<Header withMenu withLock />}
            Content={<MenuPageContent />}
          />
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
