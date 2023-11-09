import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useInfiniteScroll from 'react-infinite-scroll-hook';

import { selectAccountDeploys } from '@background/redux/account-info/selectors';
import { SpacingSize } from '@libs/layout';
import {
  AccountActivityPlate,
  List,
  LoadingActivityView,
  NoActivityView
} from '@libs/ui';
import {
  useFetchAccountDeploys,
  useMapAccountDeploysListWithPendingTransactions
} from '@src/hooks';

export const DeploysList = () => {
  const { loadMoreDeploys, loading, hasNextPage } = useFetchAccountDeploys();
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMoreDeploys,
    delayInMs: 0
  });

  const accountDeploysList = useSelector(selectAccountDeploys);

  const { accountDeploysListWithPendingTransactions } =
    useMapAccountDeploysListWithPendingTransactions(accountDeploysList);

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('activityPlateYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('activityPlateYPosition');
    } else {
      container?.scrollTo(0, 0);
    }
  }, []);

  const setActivityPlateYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'activityPlateYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  return (
    <>
      {accountDeploysListWithPendingTransactions != null &&
        accountDeploysListWithPendingTransactions?.length > 0 && (
          <List
            contentTop={SpacingSize.None}
            rows={accountDeploysListWithPendingTransactions}
            renderRow={transaction => (
              <AccountActivityPlate
                transactionInfo={transaction}
                onClick={setActivityPlateYPosition}
                isDeploysList={true}
              />
            )}
            marginLeftForItemSeparatorLine={54}
          />
        )}

      {(loading || hasNextPage) && <LoadingActivityView ref={sentryRef} />}

      {(accountDeploysListWithPendingTransactions == null ||
        accountDeploysListWithPendingTransactions.length === 0) &&
        !loading && (
          <NoActivityView
            activityList={accountDeploysListWithPendingTransactions}
            top={SpacingSize.None}
          />
        )}
    </>
  );
};
