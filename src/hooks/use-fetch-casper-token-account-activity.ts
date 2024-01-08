import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';

import { useForceUpdate } from '@popup/hooks/use-force-update';

import {
  accountCasperActivityChanged,
  accountCasperActivityCountChanged,
  accountCasperActivityUpdated
} from '@background/redux/account-info/actions';
import {
  selectAccountCasperActivity,
  selectAccountCasperActivityCount
} from '@background/redux/account-info/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchFetchAccountCasperActivity } from '@libs/services/account-activity-service';

export const useFetchCasperTokenAccountActivity = () => {
  const [loading, setLoading] = useState(false);
  const [accountCasperActivityPage, setAccountCasperActivityPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFirstPageLoad, setIsFirstPageLoad] = useState(false);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const accountCasperActivityList = useSelector(selectAccountCasperActivity);
  const casperTokenActivityCount = useSelector(
    selectAccountCasperActivityCount
  );

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const activeAccountHash = activeAccount?.publicKey
    ? getAccountHashFromPublicKey(activeAccount?.publicKey)
    : null;

  const handleError = (error: Error) => {
    console.error('Account casper token activity request failed:', error);
  };

  useEffect(() => {
    if (casperTokenActivityCount > accountCasperActivityList.length) {
      setHasNextPage(true);
    }

    if (
      casperTokenActivityCount === 0 &&
      accountCasperActivityList.length === 0
    ) {
      setAccountCasperActivityPage(2);
    }
  }, [
    activeAccountHash,
    accountCasperActivityList.length,
    accountCasperActivityPage,
    casperTokenActivityCount
  ]);

  useEffect(() => {
    if (!activeAccountHash) return;

    // set loading to true only for the first time
    if (accountCasperActivityList.length === 0 && !isFirstPageLoad) {
      setLoading(true);
    }

    dispatchFetchAccountCasperActivity(activeAccountHash, 1)
      .then(({ payload }) => {
        if (payload) {
          const {
            data: casperTokensActivityList,
            pageCount,
            itemCount
          } = payload;

          if (
            itemCount === accountCasperActivityList?.length ||
            itemCount === casperTokenActivityCount
          ) {
            return;
          }

          const transactions =
            casperTokensActivityList?.map(transaction => ({
              ...transaction,
              id: transaction.deployHash
            })) || [];

          dispatchToMainStore(accountCasperActivityChanged(transactions));
          dispatchToMainStore(accountCasperActivityCountChanged(itemCount));

          if (pageCount > 1) {
            setHasNextPage(true);
          }
        }
      })
      .catch(handleError)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 300);
        setIsFirstPageLoad(true);
      });

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
  }, [
    casperApiUrl,
    forceUpdate,
    activeAccountHash,
    accountCasperActivityList.length,
    accountCasperActivityPage,
    casperTokenActivityCount,
    isFirstPageLoad
  ]);

  const loadMoreAccountCasperActivity = useCallback(() => {
    if (!activeAccountHash) return;

    setLoading(true);

    dispatchFetchAccountCasperActivity(
      activeAccountHash,
      accountCasperActivityPage
    )
      .then(({ payload }) => {
        if (payload) {
          const {
            data: casperTokensActivityList,
            pageCount,
            itemCount
          } = payload;

          if (itemCount === accountCasperActivityList?.length) {
            setHasNextPage(false);
            return;
          }

          const transactions =
            casperTokensActivityList?.map(transaction => ({
              ...transaction,
              id: transaction.deployHash
            })) || [];

          dispatchToMainStore(accountCasperActivityUpdated(transactions));

          if (accountCasperActivityPage + 1 <= pageCount) {
            setAccountCasperActivityPage(accountCasperActivityPage + 1);
          }

          if (casperTokenActivityCount !== itemCount) {
            dispatchToMainStore(accountCasperActivityCountChanged(itemCount));
          }

          if (accountCasperActivityPage >= pageCount) {
            setHasNextPage(false);
          }
        }
      })
      .catch(handleError)
      .finally(() => {
        setLoading(false);
      });
  }, [
    accountCasperActivityList?.length,
    accountCasperActivityPage,
    activeAccountHash,
    casperTokenActivityCount
  ]);

  return {
    loading,
    loadMoreAccountCasperActivity,
    hasNextPage
  };
};
