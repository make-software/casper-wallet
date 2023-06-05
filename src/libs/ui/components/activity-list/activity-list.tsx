import React from 'react';

import { SpacingSize } from '@libs/layout';
import { List, AccountActivityPlate, Typography } from '@libs/ui';
import { useAccountTransactions } from '@src/hooks';
import { useParams } from 'react-router-dom';

export enum ActivityListDisplayContext {
  Home = 'home',
  TokenDetails = 'token-details'
}

interface ActivityListProps {
  displayContext: ActivityListDisplayContext;
}

export const ActivityList = ({ displayContext }: ActivityListProps) => {
  const { transactions, observerElement } = useAccountTransactions();
  const { tokenName } = useParams();

  if (tokenName !== 'Casper') {
    return <Typography type="header">NOT IMPLEMENTED</Typography>;
  }

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
