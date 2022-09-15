import throttle from 'lodash.throttle';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { dispatchToMainStore } from '~src/libs/redux/utils';
import { timeoutRefreshed, vaultLocked } from '~src/libs/redux/vault/actions';
import {
  selectVaultDoesExist,
  selectVaultIsLocked,
  selectVaultLastActivityTime,
  selectVaultTimeoutDurationSetting
} from '~src/libs/redux/vault/selectors';
import { TimeoutDurationSetting } from '~src/libs/redux/vault/types';

const MapTimeoutDurationSettingToValue: Record<string, number> = {
  [TimeoutDurationSetting['1 min']]: 1000 * 60 * 1,
  [TimeoutDurationSetting['5 min']]: 1000 * 60 * 5,
  [TimeoutDurationSetting['15 min']]: 1000 * 60 * 15,
  [TimeoutDurationSetting['30 min']]: 1000 * 60 * 30,
  [TimeoutDurationSetting['1 hour']]: 1000 * 60 * 60,
  [TimeoutDurationSetting['24 hours']]: 1000 * 60 * 60 * 24
};

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
