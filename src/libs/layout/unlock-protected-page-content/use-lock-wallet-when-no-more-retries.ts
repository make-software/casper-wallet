import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { UseFormResetField } from 'react-hook-form/dist/types/form';

import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectIsLoginRetryLockout } from '@background/redux/login-retry-lockout-time/selectors';
import { loginRetryLockoutTimeSet } from '@background/redux/login-retry-lockout-time/actions';
import { lockVault } from '@background/redux/sagas/actions';
import { selectVaultIsLocked } from '@background/redux/session/selectors';

export const useLockWalletWhenNoMoreRetries = (
  resetField?: UseFormResetField<{ password: string }>
) => {
  const loginRetryCount = useSelector(selectLoginRetryCount);
  const isLoginRetryLockout = useSelector(selectIsLoginRetryLockout);
  const isLocked = useSelector(selectVaultIsLocked);

  const loginRetryLeft = 5 - loginRetryCount;

  useEffect(() => {
    if (isLoginRetryLockout) {
      const currentTime = Date.now();
      dispatchToMainStore(loginRetryLockoutTimeSet(currentTime));

      // Need this for cases when the vault is not locked
      if (!isLocked) {
        dispatchToMainStore(lockVault());
      }
      if (resetField) {
        resetField('password');
      }
    }
  }, [isLocked, resetField, isLoginRetryLockout]);

  return { loginRetryLeft };
};
