import { useCallback } from 'react';
import { Account } from '@popup/redux/vault/types';
import {
  changeActiveAccount as changeActiveAccountAction,
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
  selectIsActiveAccountConnectedWithOrigin,
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccountNamesByOriginDict,
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
  const accountNamesByOrigin = useSelector(selectVaultAccountNamesByOriginDict);
  const connectedAccountNames = useSelector((state: RootState) =>
    selectConnectedAccountNamesWithOrigin(state, origin)
  );
  const isActiveAccountConnected = useSelector((state: RootState) =>
    selectIsActiveAccountConnectedWithOrigin(state, origin)
  );

  const changeActiveAccount = useCallback(
    async (name: string) => {
      const nextActiveAccount = accounts.find(account => account.name === name);

      if (nextActiveAccount) {
        dispatch(changeActiveAccountAction(name));
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

  const disconnectAllAccounts = useCallback(
    async (origin: string) => {
      if (!origin) {
        return;
      }

      // TODO: An active account may not be related to the site from which the user is trying to disconnect.
      //  Therefore, it makes no sense to send the public key from the account of others site.
      //  It would be better if we can send an array of keys from a list of accounts that are being disconnected
      //  !!! I send a public key for first account by origin as temporary solution. !!!
      function getPublicKeyByOrigin(origin: string) {
        const firstAccountNameByOrigin = accountNamesByOrigin[origin][0];
        const firstAccountByOrigin = accounts.find(
          account => account.name === firstAccountNameByOrigin
        );

        return firstAccountByOrigin?.publicKey;
      }

      const activeKey = getPublicKeyByOrigin(origin);

      if (activeKey != null) {
        dispatch(
          disconnectAllAccountsFromSite({
            siteOrigin: origin
          })
        );

        await sendDisconnectAccount(
          {
            isConnected: false,
            isUnlocked: !isLocked,
            activeKey
          },
          currentWindow
        );
      }
    },
    [dispatch, currentWindow, accountNamesByOrigin, accounts, isLocked]
  );

  const disconnectAccount = useCallback(
    async (accountName: string, origin: string) => {
      if (origin == null) {
        return;
      }

      if (accountNamesByOrigin[origin].length === 1) {
        await disconnectAllAccounts(origin);
        return;
      }

      if (activeAccount == null || !isActiveAccountConnected) {
        return;
      }

      dispatch(
        disconnectAccountFromSite({
          siteOrigin: origin,
          accountName
        })
      );

      const nextActiveAccount = getNextActiveAccount(
        accounts,
        connectedAccountNames.filter(name => accountName !== name),
        activeAccount
      );

      if (nextActiveAccount) {
        await changeActiveAccount(nextActiveAccount.name);
      }
    },
    [
      dispatch,
      accountNamesByOrigin,
      activeAccount,
      isActiveAccountConnected,
      accounts,
      connectedAccountNames,
      disconnectAllAccounts,
      changeActiveAccount
    ]
  );

  return {
    connectAccount,
    disconnectAccount,
    disconnectAllAccounts,
    changeActiveAccount
  };
}
