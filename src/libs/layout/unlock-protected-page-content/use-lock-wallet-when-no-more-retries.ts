import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { UseFormResetField } from 'react-hook-form/dist/types/form';

import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { lockVaultForFiveMinutes } from '@background/redux/sagas/actions';

export const useLockWalletWhenNoMoreRetries = (
  resetField?: UseFormResetField<{ password: string }>
) => {
  const loginRetryCount = useSelector(selectLoginRetryCount);

  const retryLeft = 5 - loginRetryCount;

  useEffect(() => {
    if (retryLeft <= 0) {
      dispatchToMainStore(lockVaultForFiveMinutes());

      if (resetField) {
        resetField('password');
      }
    }
  }, [retryLeft, resetField]);

  return { loginRetryLeft: retryLeft };
};
