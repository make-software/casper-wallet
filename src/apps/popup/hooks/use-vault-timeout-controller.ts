import { useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import throttle from 'lodash.throttle';

import {
  selectVaultDoesExist,
  selectVaultIsLocked,
  selectVaultTimeoutDurationSetting,
  selectVaultLastActivityTime
} from '@popup/redux/vault/selectors';
import { vaultLocked, timeoutRefreshed } from '@popup/redux/vault/actions';

import { MapTimeoutDurationSettingToValue } from '../constants';
import { dispatchToMainStore } from '../redux/utils';

export function useVaultTimeoutController(): void {
  const timeoutCounterRef = useRef<NodeJS.Timeout>();

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
        dispatchToMainStore(vaultLocked());
      } else {
        timeoutCounterRef.current && clearTimeout(timeoutCounterRef.current);
        timeoutCounterRef.current = setTimeout(() => {
          dispatchToMainStore(vaultLocked());
        }, timeoutDurationValue);
      }
    }
    return () => {
      timeoutCounterRef.current && clearTimeout(timeoutCounterRef.current);
    };
  }, [
    vaultDoesExists,
    vaultIsLocked,
    vaultLastActivityTime,
    timeoutDurationValue
  ]);

  // should refresh timeout on any user activity
  useEffect(() => {
    const events = ['mousemove', 'click', 'scroll', 'keypress'];
    const throttleDelay = 60000;
    const throttledRefreshTimeout = throttle(
      () => {
        dispatchToMainStore(timeoutRefreshed());
      },
      throttleDelay,
      { trailing: false }
    );

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
  }, [vaultDoesExists, vaultIsLocked]);
}
