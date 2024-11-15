import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccountsPublicKeys,
  selectVaultActiveAccountName,
  selectVaultHiddenAccounts,
  selectVaultVisibleAccounts
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { ContentContainer, SpacingSize } from '@libs/layout';
import { useFetchAccountsInfo } from '@libs/services/account-info';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import {
  AccountListRowWithAccountHash,
  AccountListRows
} from '@libs/types/account';
import { List } from '@libs/ui/components';
import { AccountListItem } from '@libs/ui/components/account-list/account-list-item';
import { sortAccounts } from '@libs/ui/components/account-list/utils';

export const AllAccountsContent = () => {
  const [visibleAccountsWithId, setVisibleAccountsWithId] = useState<
    AccountListRowWithAccountHash<AccountListRows>[]
  >([]);
  const [hiddenAccountsWithId, setHiddeAccountsWithId] = useState<
    AccountListRowWithAccountHash<AccountListRows>[]
  >([]);

  const { t } = useTranslation();

  const visibleAccounts = useSelector(selectVaultVisibleAccounts);
  const hiddenAccounts = useSelector(selectVaultHiddenAccounts);
  const connectedAccountNames =
    useSelector(selectConnectedAccountNamesWithActiveOrigin) || [];
  const activeAccountName = useSelector(selectVaultActiveAccountName);
  const accountsPublicKeys = useSelector(selectVaultAccountsPublicKeys);

  const accountsInfo = useFetchAccountsInfo(accountsPublicKeys);
  const { accountsBalances, isLoadingBalance } = useFetchWalletBalance();

  useEffect(() => {
    const visibleAccountListRows = sortAccounts(
      visibleAccounts,
      activeAccountName,
      connectedAccountNames
    ).map(account => ({
      ...account,
      id: account.name,
      accountHash: getAccountHashFromPublicKey(account.publicKey)
    }));

    setVisibleAccountsWithId(visibleAccountListRows);

    const hiddenAccountListRows = sortAccounts(
      hiddenAccounts,
      activeAccountName,
      connectedAccountNames
    ).map(account => ({
      ...account,
      id: account.name,
      accountHash: getAccountHashFromPublicKey(account.publicKey)
    }));

    setHiddeAccountsWithId(hiddenAccountListRows);
    // We need to sort the account list only on the component mount and when new accounts are added
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleAccounts, hiddenAccounts]);

  return (
    <ContentContainer>
      <List
        contentTop={SpacingSize.Small}
        headerLabelTop={SpacingSize.Large}
        rows={visibleAccountsWithId}
        headerLabel={t('Active accounts')}
        renderRow={account => {
          const isConnected = connectedAccountNames.includes(account.name);
          const isActiveAccount = activeAccountName === account.name;

          const accountLiquidBalance =
            accountsBalances &&
            accountsBalances[account.accountHash]?.liquidBalance;

          return (
            <AccountListItem
              account={account}
              isActiveAccount={isActiveAccount}
              isConnected={isConnected}
              showHideAccountItem
              accountsInfo={accountsInfo}
              accountLiquidBalance={accountLiquidBalance}
              isLoadingBalance={isLoadingBalance}
            />
          );
        }}
        marginLeftForItemSeparatorLine={68}
      />
      {!!hiddenAccountsWithId.length && (
        <List
          contentTop={SpacingSize.Small}
          headerLabelTop={SpacingSize.Large}
          rows={hiddenAccountsWithId}
          headerLabel={t('Hidden accounts')}
          renderRow={account => {
            const isConnected = connectedAccountNames.includes(account.name);

            const accountLiquidBalance =
              accountsBalances &&
              accountsBalances[account.accountHash]?.liquidBalance;

            return (
              <AccountListItem
                account={account}
                isActiveAccount={false}
                isConnected={isConnected}
                showHideAccountItem
                accountsInfo={accountsInfo}
                accountLiquidBalance={accountLiquidBalance}
                isLoadingBalance={isLoadingBalance}
              />
            );
          }}
          marginLeftForItemSeparatorLine={68}
        />
      )}
    </ContentContainer>
  );
};
