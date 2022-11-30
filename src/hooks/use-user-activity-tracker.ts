import throttle from 'lodash.throttle';
import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { dispatchToMainStore } from '../background/redux/utils';
import { selectVaultIsLocked } from '@src/background/redux/session/selectors';
import { lastActivityTimeRefreshed } from '@src/background/redux/session/actions';
import { selectKeysDoesExist } from '@src/background/redux/keys/selectors';

export function useUserActivityTracker(): void {
  const keysDoesExist = useSelector(selectKeysDoesExist);
  const vaultIsLocked = useSelector(selectVaultIsLocked);

  // window listeners that dispatch timeout refresh action on any user activity
  useEffect(() => {
    const events = ['mousemove', 'click', 'keydown'];
    const throttleDelay = 5000;
    const throttledRefreshTimeout = throttle(
      () => {
        dispatchToMainStore(lastActivityTimeRefreshed());
      },
      throttleDelay,
      { trailing: false }
    );

    if (keysDoesExist && !vaultIsLocked) {
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
  }, [keysDoesExist, vaultIsLocked]);
}
