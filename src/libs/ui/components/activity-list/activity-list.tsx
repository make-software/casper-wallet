import React from 'react';

import { SpacingSize } from '@libs/layout';
import { List, AccountActivityPlate } from '@libs/ui';
import { useAccountTransactions } from '@src/hooks';

export const ActivityList = () => {
  const { transactions, observerElement } = useAccountTransactions();

  return (
    <List
      contentTop={SpacingSize.Medium}
      rows={transactions}
      scrollable
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
