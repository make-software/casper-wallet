import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Account } from '@popup/redux/vault/types';
import { connectAccountToSite } from '@popup/redux/vault/actions';
import { sendConnectStatus } from '@content/remote-actions';
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
      const isConnected = account.connectedToSites.includes(origin);

      // TODO: should handle behavior for locked app
      if (isConnected || isLocked) {
        return;
      }

      dispatch(
        connectAccountToSite({
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
