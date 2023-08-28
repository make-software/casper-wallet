import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectAccountCasperActivity } from '@background/redux/account-info/selectors';
import {
  useFetchCasperTokenAccountActivity,
  useInfinityScroll
} from '@src/hooks';
import { AccountCasperActivityPlate, List, NoActivityView } from '@libs/ui';
import { SpacingSize } from '@libs/layout';

export const CasperTokenActivityList = () => {
  const accountCasperActivityList = useSelector(selectAccountCasperActivity);

  const { loading, loadMoreAccountCasperActivity } =
    useFetchCasperTokenAccountActivity();
  const { observerElement } = useInfinityScroll(loadMoreAccountCasperActivity);

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

  if (
    accountCasperActivityList == null ||
    accountCasperActivityList.length === 0
  ) {
    return (
      <NoActivityView
        activityList={accountCasperActivityList}
        loading={loading}
      />
    );
  }

  return (
    <List
      contentTop={SpacingSize.Small}
      rows={accountCasperActivityList!}
      renderRow={(transaction, index) => (
        <AccountCasperActivityPlate
          ref={
            index === accountCasperActivityList!?.length - 1
              ? observerElement
              : null
          }
          transactionInfo={transaction}
          onClick={setCasperTokenYPosition}
        />
      )}
      marginLeftForItemSeparatorLine={54}
    />
  );
};
