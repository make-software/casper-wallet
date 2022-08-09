import { useCallback } from 'react';
import { Account } from '@popup/redux/vault/types';
import {
  setActiveAccountName,
  connectAccountToSite,
  disconnectAccountFromSite,
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
  selectConnectedAccountNames,
  selectVaultAccounts,
  selectVaultActiveAccount,
  selectVaultIsLocked
} from '@popup/redux/vault/selectors';
import { RootState } from 'typesafe-actions';
import { useActiveTabOrigin } from '@src/hooks';

export function getNextActiveAccount(
  accounts: Account[],
  connectedAccountNames: string[],
  currentActiveAccount: Account
) {
  if (connectedAccountNames.includes(currentActiveAccount.name)) {
    return currentActiveAccount;
  }

  const currentActiveAccountIndex = accounts.findIndex(
    account => account.name === currentActiveAccount.name
  );

  const nextAccountBelowCurrentActiveAccount = accounts
    .slice(currentActiveAccountIndex)
    .find(account => connectedAccountNames.includes(account.name));

  if (nextAccountBelowCurrentActiveAccount) {
    return nextAccountBelowCurrentActiveAccount;
  }

  // next account above current active account
  return accounts
    .slice(0, currentActiveAccountIndex)
    .find(account => connectedAccountNames.includes(account.name));
}

interface UseAccountManagerProps {
  currentWindow: boolean;
}

export function useAccountManager({ currentWindow }: UseAccountManagerProps) {
  const dispatch = useDispatch();

  const origin = useActiveTabOrigin({ currentWindow });

  const isLocked = useSelector(selectVaultIsLocked);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const accounts = useSelector(selectVaultAccounts);
  const connectedAccountNames = useSelector((state: RootState) =>
    selectConnectedAccountNames(state, origin)
  );
  const isActiveAccountConnected = useSelector((state: RootState) =>
    selectActiveAccountIsConnectedToOrigin(state, origin)
  );

  const changeActiveAccount = useCallback(
    async (name: string) => {
      const nextActiveAccount = accounts.find(account => account.name === name);

      if (nextActiveAccount) {
        dispatch(setActiveAccountName(name));
        const isNextActiveAccountConnected = connectedAccountNames.some(
          accountName => accountName === nextActiveAccount.name
        );
        if (isNextActiveAccountConnected) {
          await sendActiveAccountChanged(
            {
              isConnected: true,
              isUnlocked: !isLocked,
              activeKey: nextActiveAccount.publicKey
            },
            currentWindow
          );
        }
      }
    },
    [dispatch, currentWindow, connectedAccountNames, accounts, isLocked]
  );

  const connectAccount = useCallback(
    async (account: Account) => {
      // TODO: should handle behavior for locked app
      console.log('handleConnectAccount fired', account, isLocked, origin);
      if (origin === null || isLocked) {
        return;
      }

      const isConnected = connectedAccountNames.some(
        connectedAccountName => connectedAccountName === account.name
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
    },
    [dispatch, currentWindow, origin, isLocked, connectedAccountNames]
  );

  const disconnectAccount = useCallback(
    async (account: Account, origin: string) => {
      if (!activeAccount || !isActiveAccountConnected || !origin) {
        return;
      }

      dispatch(
        disconnectAccountFromSite({
          siteOrigin: origin,
          accountName: account.name
        })
      );

      const nextActiveAccount = getNextActiveAccount(
        accounts,
        connectedAccountNames.filter(
          accountName => accountName !== account.name
        ),
        activeAccount
      );

      if (nextActiveAccount) {
        await changeActiveAccount(nextActiveAccount.name);
      }
    },
    [
      dispatch,
      activeAccount,
      isActiveAccountConnected,
      accounts,
      connectedAccountNames,
      changeActiveAccount
    ]
  );

  const disconnectAllAccounts = useCallback(
    async (origin: string) => {
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
    },
    [dispatch, currentWindow, activeAccount, isActiveAccountConnected, isLocked]
  );

  return {
    connectAccount,
    disconnectAccount,
    disconnectAllAccounts,
    changeActiveAccount
  };
}
