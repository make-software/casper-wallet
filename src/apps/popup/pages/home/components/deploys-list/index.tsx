import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountDeploys } from '@background/redux/account-info/selectors';
import { SpacingSize } from '@libs/layout';
import { AccountActivityPlate, List, NoActivityView } from '@libs/ui';
import {
  useMapAccountDeploysListWithPendingTransactions,
  useInfinityScroll,
  useFetchAccountDeploys
} from '@src/hooks';

export const DeploysList = () => {
  const { loadMoreDeploys, loading } = useFetchAccountDeploys();
  const { observerElement } = useInfinityScroll(loadMoreDeploys);

  const accountDeploysList = useSelector(selectAccountDeploys);

  const { accountDeploysListWithPendingTransactions } =
    useMapAccountDeploysListWithPendingTransactions(accountDeploysList);

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

  if (
    accountDeploysListWithPendingTransactions == null ||
    accountDeploysListWithPendingTransactions.length === 0
  ) {
    return (
      <NoActivityView
        activityList={accountDeploysListWithPendingTransactions}
        top={SpacingSize.None}
        loading={loading}
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
