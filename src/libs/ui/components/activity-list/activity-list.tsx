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
import { useFetchAccountActivity, useInfinityScroll } from '@src/hooks';
import {
  selectAccountCasperActivity,
  selectAccountErc20TokensActivity
} from '@background/redux/account-info/selectors';
import { Erc20TransferWithId } from '@src/libs/services/account-activity-service';
import { ActivityListTransactionsType } from '@src/constants';

export const ActivityList = () => {
  const accountCasperActivityList = useSelector(selectAccountCasperActivity);
  const erc20TokensActivityRecord =
    useSelector(selectAccountErc20TokensActivity) || {};

  const { tokenName } = useParams();

  const erc20TokenActivityList =
    erc20TokensActivityRecord[tokenName || ''] || null;

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
      accountCasperActivityList == null ||
      accountCasperActivityList.length === 0
    ) {
      return <NoActivityView activityList={accountCasperActivityList} />;
    }

    // render casper activity list
    return (
      <List
        contentTop={SpacingSize.Small}
        rows={accountCasperActivityList!}
        renderRow={(transaction, index) => {
          if (index === accountCasperActivityList!?.length - 1) {
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
      erc20TokenActivityList?.map(transaction => {
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
          fromPublicKey: transaction?.from_public_key || null,
          contractPackage: transaction?.contract_package,
          toHash: transaction?.to_hash,
          toType: transaction?.to_type
        };
      }) || [];

    const noActivityForErc20 =
      (ActivityListTransactionsType.Erc20 && erc20TokenActivityList == null) ||
      erc20TokenActivityList?.length === 0;

    if (noActivityForErc20) {
      return <NoActivityView activityList={erc20TokenActivityList} />;
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
