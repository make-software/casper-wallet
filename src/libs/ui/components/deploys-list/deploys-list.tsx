import React from 'react';
import { useSelector } from 'react-redux';

import { selectAccountDeploys } from '@background/redux/account-info/selectors';
import { ExtendedDeployWithId } from '@libs/services/account-activity-service';
import { SpacingSize } from '@libs/layout';
import { AccountActivityPlate, List, NoActivityView } from '@libs/ui';
import {
  useAccountPendingTransactions,
  useFetchAccountDeploys,
  useInfinityScroll
} from '@src/hooks';

export const DeploysList = () => {
  const accountDeploys = useSelector(selectAccountDeploys);

  const { accountActivityListWithPendingTransactions } =
    useAccountPendingTransactions(accountDeploys);

  const { fetchMoreTransactions } = useFetchAccountDeploys();
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);

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

  return (
    <List
      contentTop={SpacingSize.None}
      rows={
        accountActivityListWithPendingTransactions as ExtendedDeployWithId[]
      }
      renderRow={(transaction, index) => {
        if (index === accountActivityListWithPendingTransactions!?.length - 1) {
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
