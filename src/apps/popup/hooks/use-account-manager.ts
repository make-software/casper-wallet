import { useCallback } from 'react';
import { Account } from '@popup/redux/vault/types';
import {
  changeActiveAccount,
  connectAccountToSite,
  disconnectAllAccountsFromSite
} from '@popup/redux/vault/actions';
import {
  sendActiveAccountChanged,
  sendConnectStatus,
  sendDisconnectAccount
} from '@content/remote-actions';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectActiveAccountIsConnectedToOrigin,
  selectConnectedAccountsToOrigin,
  selectVaultAccounts,
  selectVaultActiveAccount,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { RootState } from 'typesafe-actions';
import { useActiveTabOrigin } from '@src/hooks';
import { useTypedNavigate } from '@popup/router';

interface UseAccountManagerProps {
  currentWindow: boolean;
}

export function useAccountManager({ currentWindow }: UseAccountManagerProps) {
  const navigate = useTypedNavigate();
  const dispatch = useDispatch();

  const origin = useActiveTabOrigin({ currentWindow });

  const isLocked = useSelector(selectVaultIsLocked);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const accounts = useSelector(selectVaultAccounts);
  const connectedAccounts = useSelector((state: RootState) =>
    selectConnectedAccountsToOrigin(state, origin)
  );
  const isActiveAccountConnected = useSelector((state: RootState) =>
    selectActiveAccountIsConnectedToOrigin(state, origin)
  );

  const handleConnectAccount = useCallback(
    async (account: Account, redirectToPage?: string) => {
      // TODO: should handle behavior for locked app
      console.log('handleConnectAccount fired', account, isLocked, origin);
      if (origin === null || isLocked) {
        return;
      }

      const isConnected = connectedAccounts.some(
        connectedAccount => connectedAccount.name === account.name
      );

      if (isConnected) {
        return;
      }

      dispatch(
        connectAccountToSite({
          accountName: account.name,
          siteOrigin: origin
        })
      );

      await sendConnectStatus(
        {
          activeKey: account.publicKey,
          isConnected: true,
          isUnlocked: !isLocked
        },
        currentWindow
      );

      if (redirectToPage) {
        navigate(redirectToPage);
      }
    },
    [dispatch, navigate, currentWindow, origin, isLocked, connectedAccounts]
  );

  // TODO: Currently we can disconnect only all accounts.
  //  Need update `handleDisconnectAllAccounts` when it will be supported by `casper-js-sdk`
  //  and implement and use `disconnectAccountsFromSite` action
  //  instead `disconnectAllAccountsFromSite` for `handleDisconnectAccount`
  const handleDisconnectAccount = useCallback(
    async (account: Account, origin: string, redirectToPage?: string) => {
      if (!activeAccount || !isActiveAccountConnected || !origin) {
        return;
      }

      dispatch(
        disconnectAllAccountsFromSite({
          siteOrigin: origin
        })
      );

      await sendDisconnectAccount(
        {
          isConnected: false,
          isUnlocked: !isLocked,
          activeKey: account.publicKey
        },
        currentWindow
      );

      if (redirectToPage) {
        navigate(redirectToPage);
      }
    },
    [
      dispatch,
      navigate,
      currentWindow,
      activeAccount,
      isActiveAccountConnected,
      isLocked
    ]
  );

  const handleDisconnectAllAccounts = useCallback(
    async (origin: string, redirectToPage?: string) => {
      if (!activeAccount || !isActiveAccountConnected || !origin) {
        return;
      }

      dispatch(
        disconnectAllAccountsFromSite({
          siteOrigin: origin
        })
      );

      await sendDisconnectAccount(
        {
          isConnected: false,
          isUnlocked: !isLocked,
          activeKey: activeAccount.publicKey
        },
        currentWindow
      );

      if (redirectToPage) {
        navigate(redirectToPage);
      }
    },
    [
      dispatch,
      navigate,
      currentWindow,
      activeAccount,
      isActiveAccountConnected,
      isLocked
    ]
  );

  const handleChangeActiveAccount = useCallback(
    async (name: string, redirectToPage?: string) => {
      dispatch(changeActiveAccount(name));

      const nextAccount = accounts.find(account => account.name === name);

      if (nextAccount) {
        const isNextAccountConnected = connectedAccounts.some(
          account => account.name === nextAccount.name
        );
        if (isNextAccountConnected) {
          await sendActiveAccountChanged(
            {
              isConnected: true,
              isUnlocked: !isLocked,
              activeKey: nextAccount.publicKey
            },
            currentWindow
          );
        }
      }

      if (redirectToPage) {
        navigate(redirectToPage);
      }
    },
    [dispatch, navigate, currentWindow, connectedAccounts, accounts, isLocked]
  );

  return {
    handleConnectAccount,
    handleDisconnectAccount,
    handleDisconnectAllAccounts,
    handleChangeActiveAccount
  };
}
