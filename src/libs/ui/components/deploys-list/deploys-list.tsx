import React from 'react';
import { useSelector } from 'react-redux';

import { selectAccountDeploys } from '@background/redux/account-info/selectors';
import { SpacingSize } from '@libs/layout';
import { AccountActivityPlate, List, NoActivityView } from '@libs/ui';
import {
  useAccountPendingTransactions,
  useFetchAccountActivity,
  useInfinityScroll
} from '@src/hooks';
import { ActivityListTransactionsType } from '@src/constants';

export const DeploysList = () => {
  const accountDeploys = useSelector(selectAccountDeploys);

  const { accountDeploysListWithPendingTransactions } =
    useAccountPendingTransactions(accountDeploys);

  const { fetchMoreTransactions } = useFetchAccountActivity(
    ActivityListTransactionsType.Deploys
  );
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);

  if (
    accountDeploysListWithPendingTransactions == null ||
    accountDeploysListWithPendingTransactions.length === 0
  ) {
    return (
      <NoActivityView
        activityList={accountDeploysListWithPendingTransactions}
      />
    );
  }

  return (
    <List
      contentTop={SpacingSize.None}
      rows={accountDeploysListWithPendingTransactions}
      renderRow={(transaction, index) => {
        if (index === accountDeploysListWithPendingTransactions!?.length - 1) {
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
};
