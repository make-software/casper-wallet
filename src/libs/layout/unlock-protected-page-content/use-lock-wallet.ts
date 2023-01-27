import { useSelector } from 'react-redux';

import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { lockVault } from '@background/redux/sagas/actions';

export const useLockWallet = () => {
  const loginRetryCount = useSelector(selectLoginRetryCount);

  const retryLeft = 5 - loginRetryCount;

  if (retryLeft <= 0) {
    dispatchToMainStore(lockVault());
  }

  return retryLeft;
};
