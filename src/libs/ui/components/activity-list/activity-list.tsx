import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';

import {
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { AccountActivityPlate, List, Tile, Typography } from '@libs/ui';
import { useAccountTransactions, useInfinityScroll } from '@src/hooks';
import {
  selectAccountActivity,
  selectPendingTransactions
} from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountPendingTransactionsRemove } from '@background/redux/account-info/actions';

export enum ActivityListDisplayContext {
  Home = 'home',
  TokenDetails = 'token-details'
}

interface ActivityListProps {
  displayContext: ActivityListDisplayContext;
}

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

export const ActivityList = ({ displayContext }: ActivityListProps) => {
  const activityList = useSelector(selectAccountActivity);
  const pendingTransactions = useSelector(selectPendingTransactions);

  const filteredTransactions = useMemo(() => {
    return pendingTransactions?.filter(pendingTransaction => {
      if (activityList != null) {
        const transaction = activityList.find(
          activity => activity.deploy_hash === pendingTransaction.deploy_hash
        );

        if (transaction) {
          dispatchToMainStore(
            accountPendingTransactionsRemove(transaction?.deploy_hash)
          );
        }

        return !transaction;
      }

      return true;
    });
  }, [activityList, pendingTransactions]);

  const activityListWithPendingTransactions =
    activityList != null
      ? [...filteredTransactions, ...activityList]
      : pendingTransactions.length > 0
      ? pendingTransactions
      : null;

  const { fetchMoreTransactions } = useAccountTransactions();
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);
  const { t } = useTranslation();
  const { tokenName } = useParams();

  if (
    tokenName !== 'Casper' &&
    displayContext === ActivityListDisplayContext.TokenDetails
  ) {
    return (
      <VerticalSpaceContainer top={SpacingSize.Small}>
        <Tile>
          <Container>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>NOT IMPLEMENTED</Trans>
            </Typography>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
    );
  }

  if (
    activityListWithPendingTransactions == null ||
    activityListWithPendingTransactions?.length === 0
  ) {
    return (
      <VerticalSpaceContainer
        top={
          displayContext === ActivityListDisplayContext.Home
            ? SpacingSize.None
            : SpacingSize.Small
        }
      >
        <Tile>
          <Container>
            <Typography type="body" color="contentSecondary">
              {activityListWithPendingTransactions == null && (
                <Trans t={t}>Something went wrong</Trans>
              )}
              {activityListWithPendingTransactions?.length === 0 && (
                <Trans t={t}>No activity</Trans>
              )}
            </Typography>
          </Container>
        </Tile>
      </VerticalSpaceContainer>
    );
  }

  return (
    <List
      contentTop={
        displayContext === ActivityListDisplayContext.Home
          ? SpacingSize.None
          : SpacingSize.Small
      }
      rows={activityListWithPendingTransactions}
      renderRow={(transaction, index) => {
        if (index === activityListWithPendingTransactions?.length - 1) {
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
