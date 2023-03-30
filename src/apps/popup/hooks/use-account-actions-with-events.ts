import { useCallback } from 'react';
import { Account } from '@src/background/redux/vault/types';
import {
  activeAccountChanged,
  siteConnected,
  accountDisconnected,
  siteDisconnected,
  anotherAccountConnected
} from '@src/background/redux/vault/actions';

import { useSelector } from 'react-redux';
import {
  selectVaultAccountNamesByOriginDict,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@src/background/redux/vault/selectors';
import { sdkEvent } from '@src/content/sdk-event';
import { dispatchToMainStore } from '../../../background/redux/utils';
import { selectVaultIsLocked } from '@src/background/redux/session/selectors';
import {
  emitSdkEventToActiveTabs,
  emitSdkEventToActiveTabsWithOrigin
} from '@src/background/utils';
import { getUrlOrigin } from '@src/utils';

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

  const isAccountConnectedWithOrigin = useCallback(
    (accountName: string, origin: string | null) => {
      if (!origin) {
        return false;
      }
      return accountNamesByOriginDict[origin].includes(accountName);
    },
    [accountNamesByOriginDict]
  );

  /**
   * change active account
   */
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

      emitSdkEventToActiveTabs(tab => {
        if (!tab.url) {
          return;
        }

        const isNewAccountConnectedWithTab = isAccountConnectedWithOrigin(
          newActiveAccount.name,
          getUrlOrigin(tab.url)
        );

        return sdkEvent.changedConnectedAccountEvent({
          isLocked: isLocked,
          isConnected: isLocked ? null : isNewAccountConnectedWithTab,
          activeKey:
            !isLocked && isNewAccountConnectedWithTab
              ? newActiveAccount.publicKey
              : null
        });
      });

      dispatchToMainStore(activeAccountChanged(newActiveAccount.name));
    },
    [activeAccount?.name, accounts, isLocked, isAccountConnectedWithOrigin]
  );

  /**
   *
   */
  const connectSiteWithEvent = useCallback(
    async (accountNames: string[], origin, siteTitle: string) => {
      if (!activeAccount?.name || origin == null || isLocked) {
        return;
      }

      // new connected accounts including active
      if (accountNames.includes(activeAccount.name)) {
        emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.connectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? null : true,
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
          emitSdkEventToActiveTabs(tab => {
            if (!tab.url) {
              return;
            }

            const isNewAccountConnectedWithTab = isAccountConnectedWithOrigin(
              newActiveAccountFromConnected.name,
              getUrlOrigin(tab.url)
            );

            return sdkEvent.changedConnectedAccountEvent({
              isLocked: isLocked,
              isConnected: isLocked ? null : isNewAccountConnectedWithTab,
              activeKey: isNewAccountConnectedWithTab
                ? newActiveAccountFromConnected.publicKey
                : null
            });
          });
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
    [activeAccount, isLocked, accounts, isAccountConnectedWithOrigin]
  );

  /**
   *
   */
  const connectAnotherAccountWithEvent = useCallback(
    async (accountName: string, origin: string | null) => {
      if (!activeAccount?.name || origin == null || isLocked) {
        return;
      }

      // new connected account is active
      if (accountName === activeAccount.name) {
        emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.connectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? null : true,
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
          emitSdkEventToActiveTabs(tab => {
            if (!tab.url) {
              return;
            }

            const isNewAccountConnectedWithTab = isAccountConnectedWithOrigin(
              newActiveAccount.name,
              getUrlOrigin(tab.url)
            );

            return sdkEvent.changedConnectedAccountEvent({
              isLocked: isLocked,
              isConnected: isLocked ? null : isNewAccountConnectedWithTab,
              activeKey: isNewAccountConnectedWithTab
                ? newActiveAccount.publicKey
                : null
            });
          });
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

  /**
   *
   */
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
        emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.disconnectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? null : false,
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

  /**
   *
   */
  const disconnectSiteWithEvent = useCallback(
    async (origin: string) => {
      if (!activeAccount?.name || !origin || isLocked) {
        return;
      }

      const allAccountNames = accountNamesByOriginDict[origin];

      if (allAccountNames.includes(activeAccount.name)) {
        await emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.disconnectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? null : false,
            activeKey: activeAccount?.publicKey
          })
        );
      }

      dispatchToMainStore(
        siteDisconnected({
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
    connectSiteWithEvent,
    connectAnotherAccountWithEvent,
    disconnectAccountWithEvent,
    disconnectSiteWithEvent
  };
}
