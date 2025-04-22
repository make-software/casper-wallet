import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
  getActiveAccountSupports,
  getUrlOrigin,
  isEqualCaseInsensitive
} from '@src/utils';

import { accountInfoReset } from '@background/redux/account-info/actions';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountDisconnected,
  activeAccountChanged,
  activeAccountSupportsChanged,
  anotherAccountConnected,
  siteConnected,
  siteDisconnected
} from '@background/redux/vault/actions';
import {
  selectAccountNamesByOriginDict,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';
import {
  emitSdkEventToActiveTabs,
  emitSdkEventToActiveTabsWithOrigin
} from '@background/utils';

import { sdkEvent } from '@content/sdk-event';
import { CasperWalletSupports } from '@content/sdk-types';

import { Account } from '@libs/types/account';

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
  const accountNamesByOriginDict = useSelector(selectAccountNamesByOriginDict);

  const isAccountConnectedWithOrigin = useCallback(
    (origin: string | undefined, accountName: string) => {
      if (!origin) {
        return false;
      }

      return (accountNamesByOriginDict[origin] || []).includes(accountName);
    },
    [accountNamesByOriginDict]
  );

  /**
   * connect site
   */
  const connectSiteWithEvent = useCallback(
    async (accountNames: string[], origin: string, siteTitle: string) => {
      if (!activeAccount?.name || origin == null || isLocked) {
        return;
      }

      const selectedAccountsIncludeActive = accountNames.includes(
        activeAccount.name
      );

      const account = selectedAccountsIncludeActive
        ? activeAccount
        : findAccountInAListClosestToGivenAccountFilteredByNames(
            accounts,
            activeAccount,
            accountNames
          );

      if (account != null) {
        emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.connectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? undefined : true,
            activeKey: isLocked ? undefined : account.publicKey,
            activeKeySupports: isLocked
              ? undefined
              : getActiveAccountSupports(activeAccount)
          })
        );
        if (!selectedAccountsIncludeActive) {
          dispatchToMainStore(activeAccountChanged(account.name));
          dispatchToMainStore(accountInfoReset());
        }
        dispatchToMainStore(
          siteConnected({
            accountNames: accountNames,
            siteOrigin: origin,
            siteTitle
          })
        );
      }
    },
    [activeAccount, isLocked, accounts]
  );

  /**
   * connect another account
   */
  const connectAnotherAccountWithEvent = useCallback(
    async (accountName: string, origin: string | null) => {
      if (!activeAccount?.name || origin == null || isLocked) {
        return;
      }

      const selectedAccountIsActive = accountName === activeAccount.name;

      const account = selectedAccountIsActive
        ? activeAccount
        : accounts.find(account => account.name === accountName);

      if (account != null) {
        emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.connectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? undefined : true,
            activeKey: isLocked ? undefined : account.publicKey,
            activeKeySupports: isLocked
              ? undefined
              : getActiveAccountSupports(activeAccount)
          })
        );
        if (!selectedAccountIsActive) {
          dispatchToMainStore(activeAccountChanged(account.name));
          dispatchToMainStore(accountInfoReset());
        }
        dispatchToMainStore(
          anotherAccountConnected({
            accountName: account.name,
            siteOrigin: origin
          })
        );
      }
    },
    [accounts, activeAccount, isLocked]
  );

  /**
   * change active account
   */
  const changeActiveAccountWithEvent = useCallback(
    async (accountName: string) => {
      if (!activeAccount?.name || accountName === activeAccount.name) {
        return;
      }

      const account = accounts.find(account => account.name === accountName);
      if (account == null) {
        throw Error('new active account should be found');
      }

      emitSdkEventToActiveTabs(tab => {
        if (!tab.url) {
          return;
        }

        const isAccountConnectedWithTab = isAccountConnectedWithOrigin(
          getUrlOrigin(tab.url),
          account.name
        );

        return sdkEvent.changedConnectedAccountEvent({
          isLocked: isLocked,
          isConnected: isLocked ? undefined : isAccountConnectedWithTab,
          activeKey:
            isLocked || !isAccountConnectedWithTab
              ? undefined
              : account.publicKey,
          activeKeySupports:
            isLocked || !isAccountConnectedWithTab
              ? undefined
              : getActiveAccountSupports(activeAccount)
        });
      });

      dispatchToMainStore(activeAccountChanged(account.name));
      dispatchToMainStore(accountInfoReset());
    },
    [activeAccount?.name, accounts, isLocked, isAccountConnectedWithOrigin]
  );

  /**
   * disconnect site
   */
  const disconnectSiteWithEvent = useCallback(
    async (origin: string) => {
      if (!activeAccount?.name || !origin || isLocked) {
        return;
      }

      const allAccountNames = accountNamesByOriginDict[origin] || [];

      if (allAccountNames.includes(activeAccount.name)) {
        await emitSdkEventToActiveTabsWithOrigin(
          origin,
          sdkEvent.disconnectedAccountEvent({
            isLocked: isLocked,
            isConnected: isLocked ? undefined : false,
            activeKey: isLocked ? undefined : activeAccount?.publicKey,
            activeKeySupports: isLocked
              ? undefined
              : getActiveAccountSupports(activeAccount)
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

  /**
   * disconnect account
   */
  const disconnectAccountWithEvent = useCallback(
    async (accountName: string, origin: string) => {
      if (
        !activeAccount?.name ||
        !origin ||
        !(accountNamesByOriginDict[origin] || []).includes(accountName) ||
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
            isConnected: isLocked ? undefined : false,
            activeKey: isLocked ? undefined : activeAccount?.publicKey,
            activeKeySupports: isLocked
              ? undefined
              : getActiveAccountSupports(activeAccount)
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
   * change active account supports
   */
  const changeActiveAccountSupportsWithEvent = useCallback(
    async (publicKey: string, supportsTransactionV1: boolean) => {
      if (
        !activeAccount ||
        !isEqualCaseInsensitive(activeAccount.publicKey, publicKey)
      ) {
        return;
      }

      emitSdkEventToActiveTabs(tab => {
        if (!tab.url) {
          return;
        }

        const isAccountConnectedWithTab = isAccountConnectedWithOrigin(
          getUrlOrigin(tab.url),
          activeAccount.name
        );

        return sdkEvent.changedActiveAccountSupportsEvent({
          isLocked: isLocked,
          isConnected: isLocked ? undefined : isAccountConnectedWithTab,
          activeKey:
            isLocked || !isAccountConnectedWithTab
              ? undefined
              : activeAccount.publicKey,
          activeKeySupports:
            isLocked || !isAccountConnectedWithTab
              ? undefined
              : [
                  CasperWalletSupports.signDeploy,
                  CasperWalletSupports.signMessage,
                  ...(supportsTransactionV1
                    ? [CasperWalletSupports.signTransactionV1]
                    : [])
                ]
        });
      });

      dispatchToMainStore(
        activeAccountSupportsChanged(
          supportsTransactionV1 ? [CasperWalletSupports.signTransactionV1] : []
        )
      );
      dispatchToMainStore(accountInfoReset());
    },
    [activeAccount?.name, accounts, isLocked, isAccountConnectedWithOrigin]
  );

  return {
    connectSiteWithEvent,
    connectAnotherAccountWithEvent,
    changeActiveAccountWithEvent,
    disconnectSiteWithEvent,
    disconnectAccountWithEvent,
    changeActiveAccountSupportsWithEvent
  };
}
