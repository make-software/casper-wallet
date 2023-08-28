import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectAccountErc20TokensActivity } from '@background/redux/account-info/selectors';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { dispatchFetchErc20TokenActivity } from '@libs/services/account-activity-service/erc20-token-activity-service';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountErc20TokensActivityChanged,
  accountErc20TokensActivityUpdated
} from '@background/redux/account-info/actions';
import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';
import { useForceUpdate } from '@popup/hooks/use-force-update';

export const useFetchErc20TokenAccountActivity = (
  contractPackageHash: string
) => {
  const [loading, setLoading] = useState(false);
  const [accountErc20ActivityPage, setAccountErc20ActivityPage] = useState(1);
  const [accountErc20ActivityPageCount, setAccountErc20ActivityPageCount] =
    useState(0);
  const [downloadedOnce, setDownloadedOnce] = useState(false);

  const erc20TokensActivityRecord =
    useSelector(selectAccountErc20TokensActivity) || {};

  const tokenActivity = erc20TokensActivityRecord[contractPackageHash || ''];

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const activeAccountHash = activeAccount?.publicKey
    ? getAccountHashFromPublicKey(activeAccount?.publicKey)
    : null;

  const handleError = (error: Error) => {
    console.error('Account erc20 token activity request failed:', error);
  };

  useEffect(() => {
    setLoading(true);
  }, [casperApiUrl, activeAccountHash]);

  useEffect(() => {
    if (!activeAccountHash) return;

    // set loading to true only for the first time
    if (
      (tokenActivity?.tokenActivityList.length === 0 ||
        !tokenActivity?.tokenActivityList) &&
      !downloadedOnce
    ) {
      setLoading(true);
    }

    dispatchFetchErc20TokenActivity(activeAccountHash, contractPackageHash, 1)
      .then(({ payload }) => {
        if (payload) {
          const {
            data: erc20TokensActivityList,
            pageCount,
            itemCount
          } = payload;

          if (
            itemCount === tokenActivity?.tokenActivityList?.length ||
            itemCount === tokenActivity?.tokenActivityCount
          ) {
            return;
          }

          dispatchToMainStore(
            accountErc20TokensActivityChanged({
              contractPackageHash,
              activityList: erc20TokensActivityList,
              tokenActivityCount: itemCount
            })
          );

          setAccountErc20ActivityPageCount(pageCount);
          setAccountErc20ActivityPage(2);
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
    activeAccountHash,
    contractPackageHash,
    downloadedOnce,
    tokenActivity?.tokenActivityCount,
    tokenActivity?.tokenActivityList.length,
    casperApiUrl,
    forceUpdate,
    tokenActivity?.tokenActivityList
  ]);

  const loadMoreAccountErc20Activity = useCallback(() => {
    if (!activeAccountHash) return;

    if (accountErc20ActivityPage > accountErc20ActivityPageCount) return;

    dispatchFetchErc20TokenActivity(
      activeAccountHash,
      contractPackageHash,
      accountErc20ActivityPage
    )
      .then(({ payload }) => {
        if (payload) {
          const {
            data: erc20TokensActivityList,
            pageCount,
            itemCount
          } = payload;

          if (itemCount === tokenActivity?.tokenActivityList?.length) return;

          dispatchToMainStore(
            accountErc20TokensActivityUpdated({
              contractPackageHash,
              tokenActivityCount: itemCount,
              activityList: erc20TokensActivityList
            })
          );

          setAccountErc20ActivityPage(accountErc20ActivityPage + 1);
          setAccountErc20ActivityPageCount(pageCount);
        }
      })
      .catch(handleError);
  }, [
    accountErc20ActivityPage,
    accountErc20ActivityPageCount,
    activeAccountHash,
    contractPackageHash,
    tokenActivity?.tokenActivityList?.length
  ]);

  return {
    loading,
    loadMoreAccountErc20Activity
  };
};
