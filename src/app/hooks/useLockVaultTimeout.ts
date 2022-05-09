import { useRef, useEffect, useCallback } from 'react';
import { lockVault, resetTimeoutStartTime } from '@src/redux/vault/actions';
import debouncedResetTimeout from 'lodash.debounce';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectVaultDoesExist,
  selectVaultIsLocked,
  selectVaultTimeoutDurationSetting,
  selectVaultTimeoutStartTime
} from '@src/redux/vault/selectors';
import { MapTimeoutDurationSettingToValue } from '../constants';

export function useLockVaultTimeout() {
  const timer = useRef<NodeJS.Timeout>();
  const dispatch = useDispatch();

  const vaultTimeoutStartTime = useSelector(selectVaultTimeoutStartTime);
  const vaultIsLocked = useSelector(selectVaultIsLocked);
  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultTimeoutDurationSetting = useSelector(
    selectVaultTimeoutDurationSetting
  );

  const startTimeout = useCallback(
    (delay: number): NodeJS.Timeout => {
      return setTimeout(() => {
        if (vaultDoesExists && !vaultIsLocked) {
          dispatch(lockVault());
        }
      }, delay);
    },
    [dispatch, vaultDoesExists, vaultIsLocked]
  );

  function resetTimeout() {
    dispatch(resetTimeoutStartTime());

    const timeoutDurationValue =
      MapTimeoutDurationSettingToValue[vaultTimeoutDurationSetting];

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = startTimeout(timeoutDurationValue);
    }
  }

  const handleResetTimeout = debouncedResetTimeout(resetTimeout, 5000);

  useEffect(() => {
    const currentTime = Date.now();
    const timeoutDurationValue =
      MapTimeoutDurationSettingToValue[vaultTimeoutDurationSetting];

    if (vaultDoesExists && !vaultIsLocked && vaultTimeoutStartTime) {
      // Check if the stored timeout has expired
      if (currentTime - vaultTimeoutStartTime >= timeoutDurationValue) {
        dispatch(lockVault());
      } else {
        timer.current = startTimeout(timeoutDurationValue);
      }
    }

    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'];

    for (let i in events) {
      window.addEventListener(events[i], handleResetTimeout);
    }

    return () => {
      timer.current && clearTimeout(timer.current);
      for (let i in events) {
        window.removeEventListener(events[i], handleResetTimeout);
      }
    };
  }, [
    dispatch,
    startTimeout,
    handleResetTimeout,
    vaultDoesExists,
    vaultIsLocked,
    vaultTimeoutDurationSetting,
    vaultTimeoutStartTime
  ]);
}
