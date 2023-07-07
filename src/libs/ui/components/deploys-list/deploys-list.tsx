import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  selectAccountDeploys,
  selectPendingTransactions
} from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountPendingTransactionsRemove } from '@background/redux/account-info/actions';
import { ExtendedDeployResultWithId } from '@libs/services/account-activity-service';
import {
  CenteredFlexRow,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { AccountActivityPlate, List, Tile, Typography } from '@libs/ui';
import { useFetchAccountDeploys, useInfinityScroll } from '@src/hooks';

const Container = styled(CenteredFlexRow)`
  padding: 20px;
`;

const RenderNoActivityView = ({
  deploysList
}: {
  deploysList: ExtendedDeployResultWithId[] | null;
}) => {
  const { t } = useTranslation();

  return (
    <VerticalSpaceContainer top={SpacingSize.None}>
      <Tile>
        <Container>
          <Typography type="body" color="contentSecondary">
            {deploysList == null && <Trans t={t}>Something went wrong</Trans>}
            {deploysList?.length === 0 && <Trans t={t}>No deploys</Trans>}
          </Typography>
        </Container>
      </Tile>
    </VerticalSpaceContainer>
  );
};
export const DeploysList = () => {
  const accountDeploys = useSelector(selectAccountDeploys);
  const pendingTransactions = useSelector(selectPendingTransactions);

  // validated pending transactions
  const filteredTransactions = useMemo(() => {
    return pendingTransactions?.filter(pendingTransaction => {
      if (accountDeploys != null) {
        const transaction = accountDeploys.find(
          deploys => deploys.deploy_hash === pendingTransaction.deploy_hash
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
  }, [accountDeploys, pendingTransactions]);

  const accountDeploysListWithPendingTransactions =
    accountDeploys != null
      ? [...filteredTransactions, ...accountDeploys]
      : pendingTransactions.length > 0
      ? pendingTransactions
      : null;

  const { fetchMoreTransactions } = useFetchAccountDeploys();
  const { observerElement } = useInfinityScroll(fetchMoreTransactions);

  if (
    accountDeploysListWithPendingTransactions == null ||
    accountDeploysListWithPendingTransactions.length === 0
  ) {
    return <RenderNoActivityView deploysList={filteredTransactions} />;
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
