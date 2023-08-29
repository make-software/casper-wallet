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
  const [accountErc20ActivityPage, setAccountErc20ActivityPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFirstPageLoad, setIsFirstPageLoad] = useState(false);

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
    if (
      tokenActivity?.tokenActivityCount >
      tokenActivity?.tokenActivityList.length
    ) {
      setHasNextPage(true);
    }

    if (
      tokenActivity?.tokenActivityCount === 0 &&
      tokenActivity?.tokenActivityList.length === 0
    ) {
      setAccountErc20ActivityPage(2);
    }
  }, [
    tokenActivity?.tokenActivityCount,
    tokenActivity?.tokenActivityList.length
  ]);

  useEffect(() => {
    if (!activeAccountHash) return;

    // set loading to true only for the first time
    if (
      (tokenActivity?.tokenActivityList.length === 0 ||
        !tokenActivity?.tokenActivityList) &&
      !isFirstPageLoad
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
    activeAccountHash,
    contractPackageHash,
    tokenActivity?.tokenActivityCount,
    tokenActivity?.tokenActivityList.length,
    casperApiUrl,
    forceUpdate,
    tokenActivity?.tokenActivityList,
    isFirstPageLoad
  ]);

  const loadMoreAccountErc20Activity = useCallback(() => {
    if (!activeAccountHash) return;

    setLoading(true);

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

          if (itemCount === tokenActivity?.tokenActivityList?.length) {
            setHasNextPage(false);
            return;
          }

          dispatchToMainStore(
            accountErc20TokensActivityUpdated({
              contractPackageHash,
              tokenActivityCount: itemCount,
              activityList: erc20TokensActivityList
            })
          );

          if (accountErc20ActivityPage + 1 <= pageCount) {
            setAccountErc20ActivityPage(accountErc20ActivityPage + 1);
          }

          if (accountErc20ActivityPage >= pageCount) {
            setHasNextPage(false);
          }
        }
      })
      .catch(handleError)
      .finally(() => {
        setLoading(false);
      });
  }, [
    accountErc20ActivityPage,
    activeAccountHash,
    contractPackageHash,
    tokenActivity?.tokenActivityList?.length
  ]);

  return {
    loading,
    loadMoreAccountErc20Activity,
    hasNextPage
  };
};
