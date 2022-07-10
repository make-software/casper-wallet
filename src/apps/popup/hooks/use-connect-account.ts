import { useDispatch } from 'react-redux';

import { Account } from '@popup/redux/vault/types';
import { connectAccountToApp } from '@popup/redux/vault/actions';
import { sendConnectStatusToActiveTab } from '@content/remote-actions';
import { useCallback } from 'react';

interface UseConnectAccountProps {
  origin: string;
  isLocked: boolean;
  currentWindow?: boolean;
}

export function useConnectAccount({
  origin,
  isLocked,
  currentWindow = true
}: UseConnectAccountProps) {
  const dispatch = useDispatch();

  const connectAccount = useCallback(
    (account: Account) => {
      const isConnected = account.connectedToApps?.includes(origin);

      dispatch(
        connectAccountToApp({
          accountName: account.name,
          appOrigin: origin
        })
      );

      return sendConnectStatusToActiveTab(
        {
          activeKey: account.publicKey,
          isConnected,
          isUnlocked: !isLocked
        },
        currentWindow
      );
    },
    [dispatch, isLocked, origin, currentWindow]
  );

  return { connectAccount };
}
