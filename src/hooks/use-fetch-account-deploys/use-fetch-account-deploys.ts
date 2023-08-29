import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import {
  selectAccountDeploys,
  selectAccountDeploysCount
} from '@background/redux/account-info/selectors';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import { dispatchFetchAccountExtendedDeploys } from '@libs/services/account-activity-service';
import { ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE } from '@src/constants';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountDeploysAdded,
  accountDeploysCountChanged,
  accountDeploysUpdated
} from '@background/redux/account-info/actions';

export const useFetchAccountDeploys = () => {
  const [loading, setLoading] = useState(false);
  const [accountDeploysPage, setAccountDeploysPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isFirstPageLoad, setIsFirstPageLoad] = useState(false);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const accountDeploysList = useSelector(selectAccountDeploys);
  const accountDeploysCount = useSelector(selectAccountDeploysCount);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const handleError = (error: Error) => {
    console.error('Account deploys request failed:', error);
  };

  useEffect(() => {
    if (accountDeploysCount > accountDeploysList.length) {
      setHasNextPage(true);
    }

    const activePage = Math.ceil(accountDeploysList.length / 10);

    if (activePage + 1 > accountDeploysPage) {
      setAccountDeploysPage(activePage + 1);
    }
  }, [accountDeploysList.length, accountDeploysCount, accountDeploysPage]);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // set loading to true only for the first time
    if (accountDeploysList.length === 0 && !isFirstPageLoad) {
      setLoading(true);
    }

    dispatchFetchAccountExtendedDeploys(activeAccount?.publicKey, 1)
      .then(({ payload }) => {
        if (payload) {
          const { data: deploysList, pageCount, itemCount } = payload;

          if (
            itemCount === accountDeploysList?.length ||
            itemCount === accountDeploysCount
          ) {
            return;
          }

          const deploysListWithId = deploysList.map(deploy => ({
            ...deploy,
            id: deploy.deployHash
          }));

          dispatchToMainStore(accountDeploysAdded(deploysListWithId));
          dispatchToMainStore(accountDeploysCountChanged(itemCount));

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
    accountDeploysCount,
    accountDeploysList.length,
    activeAccount?.publicKey,
    casperApiUrl,
    forceUpdate,
    isFirstPageLoad
  ]);

  const loadMoreDeploys = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    setLoading(true);
    console.log(accountDeploysPage, 'accountDeploysPage');
    dispatchFetchAccountExtendedDeploys(
      activeAccount?.publicKey,
      accountDeploysPage
    )
      .then(({ payload }) => {
        if (payload) {
          const { data: deploysList, pageCount, itemCount } = payload;
          console.log(accountDeploysList?.length, 'accountDeploysList?.length');
          console.log(itemCount, 'itemCount');
          if (itemCount === accountDeploysList?.length) {
            setHasNextPage(false);
            return;
          }

          const deploysListWithId = deploysList.map(deploy => ({
            ...deploy,
            id: deploy.deployHash
          }));

          dispatchToMainStore(accountDeploysUpdated(deploysListWithId));

          setAccountDeploysPage(accountDeploysPage + 1);

          if (accountDeploysCount !== itemCount) {
            dispatchToMainStore(accountDeploysCountChanged(itemCount));
          }
          if (pageCount < accountDeploysPage) {
            setHasNextPage(false);
          }
        }
      })
      .catch(handleError)
      .finally(() => {
        setLoading(false);
      });
  }, [
    accountDeploysCount,
    accountDeploysList?.length,
    accountDeploysPage,
    activeAccount?.publicKey
  ]);

  return {
    loadMoreDeploys,
    loading,
    hasNextPage
  };
};
