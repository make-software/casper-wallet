import React from 'react';

import { SpacingSize } from '@libs/layout';
import { List, TransactionPlate } from '@libs/ui';
import { useAccountTransactions } from '@hooks/use-account-transactions';

export const ActivityList = () => {
  const { transactions, observerElem } = useAccountTransactions();

  return (
    <List
      contentTop={SpacingSize.Medium}
      rows={transactions}
      renderRow={(transaction, index) => {
        if (index === transactions.length - 1) {
          return (
            <TransactionPlate
              ref={observerElem}
              transactionInfo={transaction}
            />
          );
        }

        return <TransactionPlate transactionInfo={transaction} />;
      }}
      marginLeftForItemSeparatorLine={54}
    />
  );
};
