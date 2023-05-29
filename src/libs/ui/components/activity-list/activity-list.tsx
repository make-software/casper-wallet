import React from 'react';

import { SpacingSize } from '@libs/layout';
import { List, AccountActivityPlate } from '@libs/ui';
import { useAccountTransactions } from '@src/hooks';

export enum ActivityListDisplayContext {
  Home = 'home',
  TokenDetails = 'token-details'
}

interface ActivityListProps {
  displayContext: ActivityListDisplayContext;
}

export const ActivityList = ({ displayContext }: ActivityListProps) => {
  const { transactions, observerElement } = useAccountTransactions();

  return (
    <List
      contentTop={
        displayContext === ActivityListDisplayContext.Home
          ? SpacingSize.None
          : SpacingSize.Small
      }
      rows={transactions}
      renderRow={(transaction, index) => {
        if (index === transactions.length - 1) {
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
