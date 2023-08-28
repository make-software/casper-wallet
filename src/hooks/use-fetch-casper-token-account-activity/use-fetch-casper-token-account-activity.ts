import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import {
  selectAccountCasperActivity,
  selectAccountCasperActivityCount
} from '@background/redux/account-info/selectors';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';
import { dispatchFetchAccountCasperActivity } from '@libs/services/account-activity-service';
import {
  accountCasperActivityChanged,
  accountCasperActivityCountChanged,
  accountCasperActivityUpdated
} from '@background/redux/account-info/actions';
import { dispatchToMainStore } from '@background/redux/utils';

export const useFetchCasperTokenAccountActivity = () => {
  const [loading, setLoading] = useState(false);
  const [accountCasperActivityPage, setAccountCasperActivityPage] = useState(1);
  const [accountCasperActivityPageCount, setAccountCasperActivityPageCount] =
    useState(0);
  const [downloadedOnce, setDownloadedOnce] = useState(false);

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
    setLoading(true);
  }, [casperApiUrl, activeAccountHash]);

  useEffect(() => {
    if (!activeAccountHash) return;

    // set loading to true only for the first time
    if (accountCasperActivityList.length === 0 && !downloadedOnce) {
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

          setAccountCasperActivityPageCount(pageCount);
          setAccountCasperActivityPage(2);
        }
      })
      .catch(handleError)
      .finally(() => {
        setTimeout(() => {
          setLoading(false);
        }, 300);
        setDownloadedOnce(true);
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
    downloadedOnce
  ]);

  const loadMoreAccountCasperActivity = useCallback(() => {
    if (!activeAccountHash) return;

    if (accountCasperActivityPage > accountCasperActivityPageCount) return;

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

          if (itemCount === accountCasperActivityList?.length) return;

          const transactions =
            casperTokensActivityList?.map(transaction => ({
              ...transaction,
              id: transaction.deployHash
            })) || [];

          dispatchToMainStore(accountCasperActivityUpdated(transactions));

          setAccountCasperActivityPageCount(pageCount);
          setAccountCasperActivityPage(accountCasperActivityPage + 1);

          if (casperTokenActivityCount !== itemCount) {
            dispatchToMainStore(accountCasperActivityCountChanged(itemCount));
          }
        }
      })
      .catch(handleError);
  }, [
    accountCasperActivityList?.length,
    accountCasperActivityPage,
    accountCasperActivityPageCount,
    activeAccountHash,
    casperTokenActivityCount
  ]);

  return {
    loading,
    loadMoreAccountCasperActivity
  };
};
