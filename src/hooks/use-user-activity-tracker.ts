import throttle from 'lodash.throttle';
import { useEffect } from 'react';

import { useSelector } from 'react-redux';
import { dispatchToMainStore } from '../background/redux/utils';
import { selectVaultIsLocked } from '@src/background/redux/session/selectors';
import { selectKeysDoesExist } from '@src/background/redux/keys/selectors';
import { lastActivityTimeRefreshed } from '@src/background/redux/last-activity-time/actions';

const throttleDelay = 5000;
const throttledDispatchToMainStore = throttle(
  () => {
    dispatchToMainStore(lastActivityTimeRefreshed());
  },
  throttleDelay,
  {
    trailing: false
  }
);

function refreshUserActivity() {
  throttledDispatchToMainStore();
}

export function useUserActivityTracker(): void {
  const keysDoesExist = useSelector(selectKeysDoesExist);
  const vaultIsLocked = useSelector(selectVaultIsLocked);

  // window listeners that dispatch timeout refresh action on any user activity
  useEffect(() => {
    const events = ['mousemove', 'click', 'keydown'];

    if (keysDoesExist && !vaultIsLocked) {
      for (let i in events) {
        window.addEventListener(events[i], refreshUserActivity);
      }
    }

    return () => {
      throttledDispatchToMainStore.cancel();
      for (let i in events) {
        window.removeEventListener(events[i], refreshUserActivity);
      }
    };
  }, [keysDoesExist, vaultIsLocked]);
}
