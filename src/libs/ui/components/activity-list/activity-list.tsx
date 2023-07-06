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
  selectAccountErc20Activity,
  selectPendingTransactions
} from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountPendingTransactionsRemove } from '@background/redux/account-info/actions';
import {
  ExtendedDeployResultWithId,
  LedgerLiveDeploysWithId,
  Erc20TransferWithId,
  Erc20TokenActionResult
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

const RenderNoActivityView = ({
  displayContext,
  activityList
}: {
  displayContext: ActivityListDisplayContext;
  activityList:
    | (
        | Erc20TransferWithId
        | LedgerLiveDeploysWithId
        | ExtendedDeployResultWithId
      )[]
    | Erc20TokenActionResult[];
}) => {
  const { t } = useTranslation();

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

// TODO: refactor this component
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

  const erc20Transactions: Erc20TransferWithId[] =
    erc20ActivityList?.map(transaction => {
      return {
        id: transaction.deploy_hash,
        deploy_hash: transaction.deploy_hash,
        caller_public_key: transaction.deploy?.caller_public_key || '-',
        timestamp: transaction.deploy?.timestamp || '-',
        args: transaction.deploy?.args || '-',
        status: transaction.deploy?.status || '-',
        error_message: transaction.deploy?.error_message || null,
        decimals: transaction.contract_package?.metadata.decimals,
        symbol: transaction.contract_package?.metadata.symbol,
        toPublicKey: transaction?.to_public_key
      };
    }) || [];

  if (transactionsType === ActivityListTransactionsType.All) {
    // TODO: should render deploys https://make-software.atlassian.net/browse/WALLET-117
    return null;
  }

  if (transactionsType === ActivityListTransactionsType.Casper) {
    const activityListWithPendingTransactions =
      activityList != null
        ? [...filteredTransactions, ...activityList]
        : pendingTransactions.length > 0
        ? pendingTransactions
        : [];

    if (activityListWithPendingTransactions.length === 0) {
      return (
        <RenderNoActivityView
          activityList={activityListWithPendingTransactions}
          displayContext={displayContext}
        />
      );
    }

    // render casper activity list
    return (
      <List
        contentTop={
          displayContext === ActivityListDisplayContext.Home
            ? SpacingSize.None
            : SpacingSize.Small
        }
        rows={activityListWithPendingTransactions!}
        renderRow={(transaction, index) => {
          if (index === activityListWithPendingTransactions!?.length - 1) {
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

  if (transactionsType === ActivityListTransactionsType.Erc20) {
    // render no activity for erc20
    const noActivityForErc20 =
      (ActivityListTransactionsType.Erc20 && erc20ActivityList == null) ||
      erc20ActivityList?.length === 0;

    if (noActivityForErc20) {
      return (
        <RenderNoActivityView
          activityList={erc20ActivityList}
          displayContext={displayContext}
        />
      );
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
  }

  return null;
};
