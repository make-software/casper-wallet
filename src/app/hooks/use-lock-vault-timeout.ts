import { useRef, useEffect } from 'react';
import { lockVault, refreshTimeout } from '@src/redux/vault/actions';
import throttle from 'lodash.throttle';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectVaultDoesExist,
  selectVaultIsLocked,
  selectVaultTimeoutDurationSetting,
  selectVaultLastActivityTime
} from '@src/redux/vault/selectors';
import { MapTimeoutDurationSettingToValue } from '../constants';

export function useVaultTimeoutController(): void {
  const timeoutCounterRef = useRef<NodeJS.Timeout>();
  const dispatch = useDispatch();

  const vaultDoesExists = useSelector(selectVaultDoesExist);
  const vaultIsLocked = useSelector(selectVaultIsLocked);
  const vaultLastActivityTime = useSelector(selectVaultLastActivityTime);
  const vaultTimeoutDurationSetting = useSelector(
    selectVaultTimeoutDurationSetting
  );
  const timeoutDurationValue =
    MapTimeoutDurationSettingToValue[vaultTimeoutDurationSetting];

  // should init/update the timeout counter on related state updates
  // only this effect should manage ref instance to prevent complexity
  useEffect(() => {
    if (vaultDoesExists && !vaultIsLocked && vaultLastActivityTime) {
      const currentTime = Date.now();
      const timeoutExpired =
        currentTime - vaultLastActivityTime >= timeoutDurationValue;

      if (timeoutExpired) {
        dispatch(lockVault());
      } else {
        timeoutCounterRef.current && clearTimeout(timeoutCounterRef.current);
        timeoutCounterRef.current = setTimeout(() => {
          dispatch(lockVault());
        }, timeoutDurationValue);
      }
    }
    return () => {
      timeoutCounterRef.current && clearTimeout(timeoutCounterRef.current);
    };
  }, [
    dispatch,
    vaultDoesExists,
    vaultIsLocked,
    vaultLastActivityTime,
    timeoutDurationValue
  ]);

  // should refresh timeout on any user activity
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress'];
    const throttleDelay = 5000;
    const throttledRefreshTimeout = throttle(() => {
      dispatch(refreshTimeout());
    }, throttleDelay);

    if (vaultDoesExists && !vaultIsLocked) {
      for (let i in events) {
        window.addEventListener(events[i], throttledRefreshTimeout);
      }
    }

    return () => {
      throttledRefreshTimeout.cancel();
      for (let i in events) {
        window.removeEventListener(events[i], throttledRefreshTimeout);
      }
    };
  }, [dispatch, vaultDoesExists, vaultIsLocked]);
}
