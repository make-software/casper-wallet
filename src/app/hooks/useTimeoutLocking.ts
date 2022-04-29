import { useEffect } from 'react';
import { clearTimeout, lockVault } from '@src/redux/vault/actions';
import { Dispatch } from 'redux';

import { TimeoutValue, Timeout } from '../types';

interface UseTimeoutLockingProps {
  dispatch: Dispatch;
  isVaultLocked: boolean;
  isVaultExists: boolean;
  timeoutStartFrom: number | null;
  timeout: Timeout;
}

export function useTimeoutLocking({
  dispatch,
  isVaultLocked,
  isVaultExists,
  timeoutStartFrom,
  timeout
}: UseTimeoutLockingProps) {
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentTime = Date.now();

    if (!isVaultLocked && timeoutStartFrom && isVaultExists) {
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
}
