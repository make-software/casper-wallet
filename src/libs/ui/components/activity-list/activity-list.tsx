import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { SpacingSize } from '@libs/layout';
import {
  AccountActivityPlate,
  List,
  AccountCasperActivityPlate,
  NoActivityView
} from '@libs/ui';
import {
  useAccountPendingTransactions,
  useFetchAccountActivity,
  useInfinityScroll
} from '@src/hooks';
import {
  selectAccountCasperActivity,
  selectAccountErc20Activity
} from '@background/redux/account-info/selectors';
import {
  Erc20TransferWithId,
  TransferResultWithId
} from '@src/libs/services/account-activity-service';
import { ActivityListTransactionsType } from '@src/constants';

export const ActivityList = () => {
  const accountCasperActivityList = useSelector(selectAccountCasperActivity);
  const erc20ActivityList = useSelector(selectAccountErc20Activity) || [];

  const { accountActivityListWithPendingTransactions } =
    useAccountPendingTransactions(accountCasperActivityList);

  const { tokenName } = useParams();

  const transactionsType: ActivityListTransactionsType =
    tokenName === 'Casper'
      ? ActivityListTransactionsType.Casper
      : ActivityListTransactionsType.Erc20;

  const { fetchMoreTransactions } = useFetchAccountActivity(
    transactionsType,
    tokenName
  );
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);

  if (transactionsType === ActivityListTransactionsType.Casper) {
    if (
      accountActivityListWithPendingTransactions == null ||
      accountActivityListWithPendingTransactions.length === 0
    ) {
      return (
        <NoActivityView
          activityList={accountActivityListWithPendingTransactions}
        />
      );
    }

    // render casper activity list
    return (
      <List
        contentTop={SpacingSize.Small}
        rows={
          accountActivityListWithPendingTransactions! as TransferResultWithId[]
        }
        renderRow={(transaction, index) => {
          if (
            index ===
            accountActivityListWithPendingTransactions!?.length - 1
          ) {
            return (
              <AccountCasperActivityPlate
                ref={observerElement}
                transactionInfo={transaction}
              />
            );
          }

          return <AccountCasperActivityPlate transactionInfo={transaction} />;
        }}
        marginLeftForItemSeparatorLine={54}
      />
    );
  }

  if (transactionsType === ActivityListTransactionsType.Erc20) {
    const erc20Transactions: Erc20TransferWithId[] =
      erc20ActivityList?.map(transaction => {
        return {
          id: transaction.deploy_hash,
          deployHash: transaction.deploy_hash,
          callerPublicKey: transaction.deploy?.caller_public_key || '-',
          timestamp: transaction.deploy?.timestamp || '-',
          args: transaction.deploy?.args || '-',
          status: transaction.deploy?.status || '-',
          errorMessage: transaction.deploy?.error_message || null,
          decimals: transaction.contract_package?.metadata.decimals,
          symbol: transaction.contract_package?.metadata.symbol,
          toPublicKey: transaction?.to_public_key,
          contractPackage: transaction?.contract_package
        };
      }) || [];

    const noActivityForErc20 =
      (ActivityListTransactionsType.Erc20 && erc20ActivityList == null) ||
      erc20ActivityList?.length === 0;

    if (noActivityForErc20) {
      return <NoActivityView activityList={erc20ActivityList} />;
    }

    // render no activity for erc20
    return (
      <List
        contentTop={SpacingSize.Small}
        rows={erc20Transactions}
        renderRow={(transaction, index) => {
          if (index === erc20Transactions?.length - 1) {
            return (
              <AccountActivityPlate
                ref={observerElement}
                transactionInfo={transaction}
              />
            );
          }

          return <AccountActivityPlate transactionInfo={transaction} />;
        }}
        marginLeftForItemSeparatorLine={54}
      />
    );
  }

  return null;
};
