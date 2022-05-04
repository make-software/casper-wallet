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
  selectVaultHasAccount,
  selectVaultDoesExist,
  selectVaultIsLocked,
  selectVaultTimeoutDurationSetting,
  selectVaultTimeoutStartTime
} from '@src/redux/vault/selectors';
import { lockVault } from '@src/redux/vault/actions';
import { MapTimeoutDurationSettingToValue } from './constants';

export function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const vaultIsLocked = useSelector(selectVaultIsLocked);
  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultHasAccount = useSelector(selectVaultHasAccount);
  const vaultTimeoutDurationSetting = useSelector(
    selectVaultTimeoutDurationSetting
  );
  const vaultTimeoutStartTime = useSelector(selectVaultTimeoutStartTime);

  // App redirects
  useEffect(() => {
    if (vaultIsLocked) {
      navigate(RoutePath.UnlockVault);
    } else if (!vaultDoesExists) {
      navigate(RoutePath.CreateVault);
    } else if (!vaultHasAccount) {
      navigate(RoutePath.NoAccounts);
    }
  }, [vaultDoesExists, vaultHasAccount, vaultIsLocked]);

  // Timer of locking app
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentTime = Date.now();
    const timeoutDurationValue =
      MapTimeoutDurationSettingToValue[vaultTimeoutDurationSetting];

    if (vaultDoesExists && !vaultIsLocked && vaultTimeoutStartTime) {
      // Check up on opening popup
      if (currentTime - vaultTimeoutStartTime >= timeoutDurationValue) {
        dispatch(lockVault());
      } else {
        // Check up for opened popup
        interval = setInterval(() => {
          currentTime = Date.now();

          if (
            !vaultIsLocked &&
            vaultTimeoutStartTime &&
            currentTime - vaultTimeoutStartTime >= timeoutDurationValue
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
    vaultDoesExists,
    vaultIsLocked,
    vaultTimeoutStartTime,
    vaultTimeoutDurationSetting
  ]);

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
            Header={<Header menuIconType="close" withMenu withLock />}
            Content={<TimeoutPageContent />}
          />
        }
      />
    </Routes>
  );
}
