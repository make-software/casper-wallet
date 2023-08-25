import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';

import { selectAccountDeploys } from '@background/redux/account-info/selectors';
import {
  AccountActivityPlateContainer,
  ActivityPlateContentContainer,
  SpacingSize
} from '@libs/layout';
import { AccountActivityPlate, List, NoActivityView, Tile } from '@libs/ui';
import { useAccountPendingTransactions, useInfinityScroll } from '@src/hooks';
import { useAccountDeploys } from '@hooks/use-account-deploys';

export const DeploysList = () => {
  const { loadMoreDeploys, loading } = useAccountDeploys();
  const { observerElement } = useInfinityScroll(loadMoreDeploys);

  const accountDeploysList = useSelector(selectAccountDeploys);

  const { accountDeploysListWithPendingTransactions } =
    useAccountPendingTransactions(accountDeploysList);

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('activityPlateYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('activityPlateYPosition');
    }
  }, []);

  const setActivityPlateYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'activityPlateYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  if (loading) {
    return (
      <Tile>
        <AccountActivityPlateContainer>
          <Skeleton
            width={28}
            height={28}
            circle={true}
            style={{ marginRight: '4px' }}
          />
          <ActivityPlateContentContainer>
            <Skeleton height={24} borderRadius={8} />
            <Skeleton height={24} borderRadius={8} />
          </ActivityPlateContentContainer>
        </AccountActivityPlateContainer>
        <AccountActivityPlateContainer>
          <Skeleton
            width={28}
            height={28}
            circle={true}
            style={{ marginRight: '4px' }}
          />
          <ActivityPlateContentContainer>
            <Skeleton height={24} borderRadius={8} />
            <Skeleton height={24} borderRadius={8} />
          </ActivityPlateContentContainer>
        </AccountActivityPlateContainer>
      </Tile>
    );
  }

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
    <>
      <List
        contentTop={SpacingSize.None}
        rows={accountDeploysListWithPendingTransactions}
        renderRow={(transaction, index) => (
          <AccountActivityPlate
            ref={
              index === accountDeploysListWithPendingTransactions!?.length - 1
                ? observerElement
                : null
            }
            transactionInfo={transaction}
            onClick={setActivityPlateYPosition}
            isDeploysList={true}
          />
        )}
        marginLeftForItemSeparatorLine={54}
      />
    </>
  );
};
