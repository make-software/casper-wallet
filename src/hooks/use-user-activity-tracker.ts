import throttle from 'lodash.throttle';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectKeysDoesExist } from '@background/redux/keys/selectors';
import { lastActivityTimeRefreshed } from '@background/redux/last-activity-time/actions';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

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
      for (const i in events) {
        window.addEventListener(events[i], refreshUserActivity);
      }
    }

    return () => {
      throttledDispatchToMainStore.cancel();
      for (const i in events) {
        window.removeEventListener(events[i], refreshUserActivity);
      }
    };
  }, [keysDoesExist, vaultIsLocked]);
}
