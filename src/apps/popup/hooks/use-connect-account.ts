import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Account } from '@popup/redux/vault/types';
import { connectAccountToSite } from '@popup/redux/vault/actions';
import { sendConnectStatus } from '@content/remote-actions';
import {
  selectConnectedAccountsToOrigin,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { RootState } from 'typesafe-actions';

interface UseConnectAccountProps {
  origin: string | null;
  currentWindow: boolean;
}

export function useConnectAccount({
  origin,
  currentWindow
}: UseConnectAccountProps) {
  const dispatch = useDispatch();
  const isLocked = useSelector(selectVaultIsLocked);
  const connectedAccountsToSites = useSelector((state: RootState) =>
    selectConnectedAccountsToOrigin(state, origin)
  );

  const connectAccount = useCallback(
    (account: Account) => {
      // TODO: should handle behavior for locked app
      if (origin === null || isLocked) {
        return;
      }

      const isConnected = connectedAccountsToSites.some(
        connectedAccount => connectedAccount.name === account.name
      );

      if (isConnected) {
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
    [dispatch, isLocked, connectedAccountsToSites, origin, currentWindow]
  );

  return { connectAccount };
}
