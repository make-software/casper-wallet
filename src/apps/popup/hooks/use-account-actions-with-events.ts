import { useCallback } from 'react';
import { Account } from '@src/background/redux/vault/types';
import {
  activeAccountChanged,
  siteConnected,
  accountDisconnected,
  allAccountsDisconnected,
  anotherAccountConnected
} from '@src/background/redux/vault/actions';

import { useSelector } from 'react-redux';
import {
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccountNamesByOriginDict,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import { RootState } from 'typesafe-actions';
import { sdkEvent } from '@src/content/sdk-event';
import { dispatchToMainStore } from '../../../background/redux/utils';
import { selectVaultIsLocked } from '@src/background/redux/session/selectors';
import { emitSdkEventToAllActiveTabs } from '@src/background/emit-sdk-event-to-all-active-tabs';

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

  const changeActiveAccountWithEvent = useCallback(
    async (accountName: string) => {
      if (!activeAccount?.name || accountName === activeAccount.name) {
        return;
      }

      const newActiveAccount = accounts.find(
        account => account.name === accountName
      );
      if (newActiveAccount == null) {
        throw Error('new active account should be found');
      }
      const isActiveAccountConnected = connectedAccountNames.includes(
        newActiveAccount.name
      );

      emitSdkEventToAllActiveTabs(
        sdkEvent.changedConnectedAccountEvent({
          isLocked: isLocked,
          isConnected: isActiveAccountConnected,
          activeKey:
            isActiveAccountConnected && !isLocked
              ? newActiveAccount.publicKey
              : null
        })
      );

      dispatchToMainStore(activeAccountChanged(newActiveAccount.name));
    },
    [activeAccount?.name, accounts, connectedAccountNames, isLocked]
  );

  const connectSitesWithEvent = useCallback(
    async (accountNames: string[], origin, siteTitle: string) => {
      if (!activeAccount?.name || origin == null || isLocked) {
        return;
      }

      // new connected accounts including active
      if (accountNames.includes(activeAccount.name)) {
        emitSdkEventToAllActiveTabs(
          sdkEvent.connectedAccountEvent({
            isConnected: true,
            isLocked: isLocked,
            activeKey: activeAccount.publicKey
          })
        );
        dispatchToMainStore(
          siteConnected({
            accountNames: accountNames,
            siteOrigin: origin,
            siteTitle
          })
        );
      } else {
        // new connected accounts not including active
        // we'll switch active account to closest new
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
            sdkEvent.changedConnectedAccountEvent({
              isLocked: isLocked,
              isConnected: true,
              activeKey: newActiveAccountFromConnected.publicKey
            })
          );
          dispatchToMainStore(
            activeAccountChanged(newActiveAccountFromConnected.name)
          );
          dispatchToMainStore(
            siteConnected({
              accountNames: accountNames,
              siteOrigin: origin,
              siteTitle
            })
          );
        }
      }
    },
    [activeAccount, isLocked, accounts]
  );

  const connectAnotherAccountWithEvent = useCallback(
    async (accountName: string, origin) => {
      if (!activeAccount?.name || origin == null || isLocked) {
        return;
      }

      // new connected account is active
      if (accountName === activeAccount.name) {
        emitSdkEventToAllActiveTabs(
          sdkEvent.connectedAccountEvent({
            isConnected: true,
            isLocked: isLocked,
            activeKey: activeAccount.publicKey
          })
        );
        dispatchToMainStore(
          anotherAccountConnected({
            accountName,
            siteOrigin: origin
          })
        );
      } else {
        // new connected account is not active
        // we'll switch active account to new
        const newActiveAccount = accounts.find(
          account => account.name === accountName
        );

        if (newActiveAccount && newActiveAccount.name !== activeAccount.name) {
          emitSdkEventToAllActiveTabs(
            sdkEvent.changedConnectedAccountEvent({
              isLocked: isLocked,
              isConnected: true,
              activeKey: newActiveAccount.publicKey
            })
          );
          dispatchToMainStore(activeAccountChanged(newActiveAccount.name));
          dispatchToMainStore(
            anotherAccountConnected({
              accountName,
              siteOrigin: origin
            })
          );
        }
      }
    },
    [accounts, activeAccount, isLocked]
  );

  const disconnectAccountWithEvent = useCallback(
    async (accountName: string, origin: string) => {
      if (
        !activeAccount?.name ||
        !origin ||
        !accountNamesByOriginDict[origin].includes(accountName) ||
        isLocked
      ) {
        return;
      }

      // disconnected active account, so need to emit event
      if (accountName === activeAccount.name) {
        emitSdkEventToAllActiveTabs(
          sdkEvent.disconnectedAccountEvent({
            isConnected: false,
            isLocked: isLocked,
            activeKey: activeAccount?.publicKey
          })
        );
      }

      dispatchToMainStore(
        accountDisconnected({
          siteOrigin: origin,
          accountName
        })
      );
    },
    [accountNamesByOriginDict, activeAccount, isLocked]
  );

  const disconnectAllAccountsWithEvent = useCallback(
    async (origin: string) => {
      if (!activeAccount?.name || !origin || isLocked) {
        return;
      }

      const allAccountNames = accountNamesByOriginDict[origin];

      if (allAccountNames.includes(activeAccount.name)) {
        await emitSdkEventToAllActiveTabs(
          sdkEvent.disconnectedAccountEvent({
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
    changeActiveAccountWithEvent,
    connectSitesWithEvent,
    connectAnotherAccountWithEvent,
    disconnectAccountWithEvent,
    disconnectAllAccountsWithEvent
  };
}
