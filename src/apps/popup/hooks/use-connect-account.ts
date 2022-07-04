import { useDispatch, useSelector } from 'react-redux';

import { Account } from '@popup/redux/vault/types';
import { connectAccountToSite } from '@popup/redux/vault/actions';
import { sendConnectStatusToActiveTab } from '@content/remote-actions';
import { useCallback } from 'react';
import { selectVaultMapAccountNamesToConnectedTabOrigins } from '@popup/redux/vault/selectors';

export function useConnectAccount(origin: string, isLocked: boolean) {
  const dispatch = useDispatch();
  const mapAccountNamesToConnectedTabOrigins = useSelector(
    selectVaultMapAccountNamesToConnectedTabOrigins
  );

  const connectAccount = useCallback(
    (account: Account) => {
      const isConnected =
        account.name in mapAccountNamesToConnectedTabOrigins &&
        mapAccountNamesToConnectedTabOrigins[account.name].includes(origin);

      dispatch(
        connectAccountToSite({
          accountName: account.name,
          siteOrigin: origin
        })
      );

      sendConnectStatusToActiveTab({
        activeKey: account.publicKey,
        isConnected,
        isUnlocked: !isLocked
      }).catch(e => console.error(e));
    },
    [dispatch, isLocked, mapAccountNamesToConnectedTabOrigins, origin]
  );

  return { connectAccount };
}
