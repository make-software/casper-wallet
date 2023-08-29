import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useInfiniteScroll from 'react-infinite-scroll-hook';

import { selectAccountCasperActivity } from '@background/redux/account-info/selectors';
import { useFetchCasperTokenAccountActivity } from '@src/hooks';
import {
  AccountCasperActivityPlate,
  List,
  LoadingActivityView,
  NoActivityView
} from '@libs/ui';
import { SpacingSize } from '@libs/layout';

export const CasperTokenActivityList = () => {
  const accountCasperActivityList = useSelector(selectAccountCasperActivity);

  const { loading, loadMoreAccountCasperActivity, hasNextPage } =
    useFetchCasperTokenAccountActivity();
  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMoreAccountCasperActivity,
    delayInMs: 0
  });
  useEffect(() => {
    const container = document.querySelector('#ms-container');

    const position = localStorage.getItem('casperTokenYPosition');

    if (position) {
      container?.scrollTo(0, Number(position));
      localStorage.removeItem('casperTokenYPosition');
    }
  }, []);

  const setCasperTokenYPosition = () => {
    const container = document.querySelector('#ms-container');

    localStorage.setItem(
      'casperTokenYPosition',
      container?.scrollTop.toString() || ''
    );
  };

  return (
    <>
      {accountCasperActivityList != null &&
        accountCasperActivityList.length > 0 && (
          <List
            contentTop={SpacingSize.Small}
            rows={accountCasperActivityList!}
            renderRow={transaction => (
              <AccountCasperActivityPlate
                transactionInfo={transaction}
                onClick={setCasperTokenYPosition}
              />
            )}
            marginLeftForItemSeparatorLine={54}
          />
        )}

      {(loading || hasNextPage) && <LoadingActivityView ref={sentryRef} />}

      {accountCasperActivityList == null ||
        (accountCasperActivityList.length === 0 && !loading && (
          <NoActivityView activityList={accountCasperActivityList} />
        ))}
    </>
  );
};
