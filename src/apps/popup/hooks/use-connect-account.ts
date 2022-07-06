import { useDispatch } from 'react-redux';

import { Account } from '@popup/redux/vault/types';
import { connectAccountToApp } from '@popup/redux/vault/actions';
import { sendConnectStatusToActiveTab } from '@content/remote-actions';
import { useCallback } from 'react';

export function useConnectAccount(origin: string, isLocked: boolean) {
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

      sendConnectStatusToActiveTab({
        activeKey: account.publicKey,
        isConnected,
        isUnlocked: !isLocked
      }).catch(e => console.error(e));
    },
    [dispatch, isLocked, origin]
  );

  return { connectAccount };
}
