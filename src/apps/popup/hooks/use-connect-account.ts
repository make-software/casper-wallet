import { useDispatch, useSelector } from 'react-redux';

import { Account } from '@popup/redux/vault/types';
import { connectAccountToApp } from '@popup/redux/vault/actions';
import { sendConnectStatus } from '@content/remote-actions';
import { useCallback } from 'react';
import { selectVaultIsLocked } from '@popup/redux/vault/selectors';

interface UseConnectAccountProps {
  origin: string;
  currentWindow: boolean;
}

export function useConnectAccount({
  origin,
  currentWindow
}: UseConnectAccountProps) {
  const dispatch = useDispatch();
  const isLocked = useSelector(selectVaultIsLocked);

  const connectAccount = useCallback(
    (account: Account) => {
      const isConnected = account.connectedToApps.includes(origin);

      if (isConnected) {
        return;
      }

      dispatch(
        connectAccountToApp({
          accountName: account.name,
          appOrigin: origin
        })
      );

      return sendConnectStatus(
        {
          activeKey: account.publicKey,
          isConnected: true,
          isUnlocked: !isLocked
        },
        currentWindow
      );
    },
    [dispatch, isLocked, origin, currentWindow]
  );

  return { connectAccount };
}
