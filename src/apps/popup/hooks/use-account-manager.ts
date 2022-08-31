import { useCallback } from 'react';
import { Account } from '@src/background/redux/vault/types';
import {
  activeAccountChanged,
  accountsConnected,
  accountDisconnected,
  allAccountsDisconnected
} from '@src/background/redux/vault/actions';

import { useSelector } from 'react-redux';
import {
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccountNamesByOriginDict,
  selectVaultAccounts,
  selectVaultActiveAccount,
  selectVaultIsLocked,
  selectVaultActiveOrigin
} from '@src/background/redux/vault/selectors';
import { RootState } from 'typesafe-actions';
import { emitSdkEventToAllActiveTabs, sdkEvent } from '@src/content/sdk-event';
import { dispatchToMainStore } from '../../../background/redux/utils';

export function findAccountInAListClosestToGivenAccountFilteredByNames(
  accounts: Account[],
  givenAccount: Account,
  allowedAccountNames: string[]
): Account | undefined {
  // if account already connected return
  if (allowedAccountNames.includes(givenAccount.name)) {
    return givenAccount;
  }

  const activeAccountIndex = accounts.findIndex(
    account => account.name === givenAccount.name
  );

  const firstConnectedAccountBelowActiveAccount = accounts
    .slice(activeAccountIndex)
    .find(account => allowedAccountNames.includes(account.name));

  if (firstConnectedAccountBelowActiveAccount) {
    return firstConnectedAccountBelowActiveAccount;
  }

  const firstConnectedAccountAboveActiveAccount = accounts
    .slice(0, activeAccountIndex)
    .find(account => allowedAccountNames.includes(account.name));

  return firstConnectedAccountAboveActiveAccount;
}

export function useAccountManager() {
  const isLocked = useSelector(selectVaultIsLocked);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const accounts = useSelector(selectVaultAccounts);
  const accountNamesByOriginDict = useSelector(
    selectVaultAccountNamesByOriginDict
  );
  const connectedAccountNames = useSelector((state: RootState) =>
    selectConnectedAccountNamesWithOrigin(state)
  );
  const activeOrigin = useSelector((state: RootState) =>
    selectVaultActiveOrigin(state)
  );

  const changeActiveAccount = useCallback(
    async (accountName: string) => {
      if (activeAccount?.name && accountName === activeAccount.name) {
        return;
      }

      const newActiveAccount = accounts.find(
        account => account.name === accountName
      );
      if (newActiveAccount == null) {
        throw Error('new active account should be found');
      }

      const isActiveAccountConnected = connectedAccountNames.some(
        name => name === newActiveAccount.name
      );
      if (isActiveAccountConnected) {
        emitSdkEventToAllActiveTabs(
          sdkEvent.changedActiveConnectedAccountEvent({
            isConnected: true,
            isLocked: isLocked,
            activeKey: newActiveAccount.publicKey
          })
        );
      }

      dispatchToMainStore(activeAccountChanged(newActiveAccount.name));
    },
    [activeAccount?.name, accounts, connectedAccountNames, isLocked]
  );

  const connectAccounts = useCallback(
    async (accountNames: string[]) => {
      if (activeAccount?.name == null || activeOrigin == null || isLocked) {
        return;
      }

      // connected active account
      if (accountNames.includes(activeAccount.name)) {
        emitSdkEventToAllActiveTabs(
          sdkEvent.connectedActiveAccountEvent({
            isConnected: true,
            isLocked: isLocked,
            activeKey: activeAccount.publicKey
          })
        );
        dispatchToMainStore(
          accountsConnected({
            accountNames: accountNames,
            siteOrigin: activeOrigin
          })
        );
      } else {
        // not connected active account, so need to change
        const newActiveAccountFromConnected =
          findAccountInAListClosestToGivenAccountFilteredByNames(
            accounts,
            activeAccount,
            accountNames
          );

        if (
          newActiveAccountFromConnected &&
          newActiveAccountFromConnected.name !== activeAccount.name
        ) {
          emitSdkEventToAllActiveTabs(
            sdkEvent.changedActiveConnectedAccountEvent({
              isConnected: true,
              isLocked: isLocked,
              activeKey: newActiveAccountFromConnected.publicKey
            })
          );
          dispatchToMainStore(
            activeAccountChanged(newActiveAccountFromConnected.name)
          );
        }
      }
    },
    [activeAccount, activeOrigin, isLocked, accounts]
  );

  const disconnectAccount = useCallback(
    async (accountName: string, origin: string) => {
      if (
        !activeAccount?.name ||
        !origin ||
        !accountNamesByOriginDict[origin].includes(accountName) ||
        isLocked
      ) {
        return;
      }

      // disconnected active account, so need to change
      if (accountName === activeAccount.name) {
        const newActiveAccountFromConnected =
          findAccountInAListClosestToGivenAccountFilteredByNames(
            accounts,
            activeAccount,
            connectedAccountNames.filter(
              accountName => accountName !== activeAccount.name
            )
          );
        if (newActiveAccountFromConnected) {
          emitSdkEventToAllActiveTabs(
            sdkEvent.changedActiveConnectedAccountEvent({
              isConnected: true,
              isLocked: isLocked,
              activeKey: newActiveAccountFromConnected.publicKey
            })
          );
          dispatchToMainStore(
            activeAccountChanged(newActiveAccountFromConnected.name)
          );
        } else {
          // it was last account
          emitSdkEventToAllActiveTabs(
            sdkEvent.disconnectedActiveAccountEvent({
              isConnected: false,
              isLocked: isLocked,
              activeKey: activeAccount?.publicKey
            })
          );
        }
      }

      dispatchToMainStore(
        accountDisconnected({
          siteOrigin: origin,
          accountName
        })
      );
    },
    [
      accountNamesByOriginDict,
      accounts,
      activeAccount,
      connectedAccountNames,
      isLocked
    ]
  );

  const disconnectAllAccounts = useCallback(
    async (origin: string) => {
      if (!activeAccount?.name || !origin || isLocked) {
        return;
      }

      const allAccountNames = accountNamesByOriginDict[origin];
      if (allAccountNames == null || allAccountNames.length === 0) {
        return;
      }

      if (allAccountNames.includes(activeAccount.name)) {
        await emitSdkEventToAllActiveTabs(
          sdkEvent.disconnectedActiveAccountEvent({
            isConnected: false,
            isLocked: isLocked,
            activeKey: activeAccount?.publicKey
          })
        );
      }

      dispatchToMainStore(
        allAccountsDisconnected({
          siteOrigin: origin
        })
      );
    },
    [
      accountNamesByOriginDict,
      activeAccount?.name,
      activeAccount?.publicKey,
      isLocked
    ]
  );

  return {
    changeActiveAccount,
    connectAccounts,
    disconnectAccount,
    disconnectAllAccounts
  };
}
