import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { AccountActivityPlate, List, Tile, Typography } from '@libs/ui';
import { useAccountTransactions, useInfinityScroll } from '@src/hooks';
import {
  selectAccountActivity,
  selectAccountErc20Activity,
  selectPendingTransactions
} from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountPendingTransactionsRemove } from '@background/redux/account-info/actions';
import { useParams } from 'react-router-dom';
import {
  ExtendedDeployArgsResult,
  ExtendedDeployResultWithId,
  LedgerLiveDeploysWithId
} from '@src/libs/services/account-activity-service';
import { ActivityListTransactionsType } from '@src/constants';

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

const renderNoActivityView = ({
  displayContext,
  t,
  activityList
}: {
  displayContext: ActivityListDisplayContext;
  t: any;
  activityList: any;
}) => {
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
            {activityList == null && <Trans t={t}>Something went wrong</Trans>}
            {activityList?.length === 0 && <Trans t={t}>No activity</Trans>}
          </Typography>
        </Container>
      </Tile>
    </VerticalSpaceContainer>
  );
};

export const ActivityList = ({ displayContext }: ActivityListProps) => {
  const activityList = useSelector(selectAccountActivity);
  const erc20ActivityList = useSelector(selectAccountErc20Activity) || [];
  const pendingTransactions = useSelector(selectPendingTransactions);
  const { tokenName } = useParams();

  const transactionsType: ActivityListTransactionsType =
    displayContext === ActivityListDisplayContext.Home
      ? ActivityListTransactionsType.All
      : tokenName === 'Casper'
      ? ActivityListTransactionsType.Casper
      : ActivityListTransactionsType.Erc20;

  // validated pending transactions
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

  const { fetchMoreTransactions } = useAccountTransactions(
    transactionsType,
    tokenName
  );
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);
  const { t } = useTranslation();

  // render erc20 activity list
  type Erc20Transfer = {
    id: string;
    deploy_hash: string;
    caller_public_key: string;
    timestamp: string;
    args: ExtendedDeployArgsResult;
    status: string;
    error_message: string | null;
  };

  const erc20Transactions: Erc20Transfer[] =
    erc20ActivityList?.map(transaction => {
      return {
        id: transaction.deploy_hash,
        deploy_hash: transaction.deploy_hash,
        caller_public_key: transaction.deploy?.caller_public_key || '-',
        timestamp: transaction.deploy?.timestamp || '-',
        args: transaction.deploy?.args || '-',
        status: transaction.deploy?.status || '-',
        error_message: transaction.deploy?.error_message || null
      };
    }) || [];

  if (
    transactionsType === ActivityListTransactionsType.All ||
    transactionsType === ActivityListTransactionsType.Casper
  ) {
    const activityListWithPendingTransactions =
      activityList != null
        ? [...filteredTransactions, ...activityList, ...erc20Transactions]
        : pendingTransactions.length > 0
        ? pendingTransactions
        : [];
    console.log(
      'activityList',
      JSON.stringify({
        filteredTransactions: filteredTransactions?.map(
          transaction => transaction.deploy_hash
        ),
        erc20Transactions: erc20Transactions?.map(
          transaction => transaction.deploy_hash
        )
      })
    );

    // sort activityListWithPendingTransactions by timestamp property which is a date in a string format

    const sortedActivityListByTimestamp =
      activityListWithPendingTransactions.sort(
        (
          a:
            | LedgerLiveDeploysWithId
            | Erc20Transfer
            | ExtendedDeployResultWithId,
          b:
            | LedgerLiveDeploysWithId
            | Erc20Transfer
            | ExtendedDeployResultWithId
        ) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
      );

    const noActivityForAllAndCasper =
      sortedActivityListByTimestamp == null ||
      sortedActivityListByTimestamp?.length === 0;
    if (noActivityForAllAndCasper) {
      renderNoActivityView({
        t,
        displayContext,
        activityList: sortedActivityListByTimestamp
      });
    }

    // render all and casper activity list
    return (
      <List
        contentTop={
          displayContext === ActivityListDisplayContext.Home
            ? SpacingSize.None
            : SpacingSize.Small
        }
        rows={sortedActivityListByTimestamp!}
        renderRow={(transaction, index) => {
          if (index === sortedActivityListByTimestamp!?.length - 1) {
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

  // render no activity for erc20
  const noActivityForErc20 =
    (ActivityListTransactionsType.Erc20 && erc20ActivityList == null) ||
    erc20ActivityList?.length === 0;
  if (noActivityForErc20) {
    renderNoActivityView({
      t,
      displayContext,
      activityList: erc20ActivityList
    });
  }

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
};
