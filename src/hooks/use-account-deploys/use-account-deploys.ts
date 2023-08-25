import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export const useAccountDeploys = () => {
  const [loading, setLoading] = React.useState(false);
  const [accountDeploysPage, setAccountDeploysPage] = useState(1);
  const [accountDeploysPageCount, setAccountDeploysPageCount] = useState(0);

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
    if (!activeAccount?.publicKey) return;

    if (accountDeploysList == null) {
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

          setAccountDeploysPageCount(pageCount);
          setAccountDeploysPage(2);
        }
      })
      .catch(handleError)
      .finally(() => {
        setLoading(false);
      });

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_CASPER_ACTIVITY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, forceUpdate]);

  const loadMoreDeploys = useCallback(() => {
    if (
      !activeAccount?.publicKey ||
      accountDeploysPage > accountDeploysPageCount
    )
      return;

    dispatchFetchAccountExtendedDeploys(
      activeAccount?.publicKey,
      accountDeploysPage
    )
      .then(({ payload }) => {
        if (payload) {
          const { data: deploysList, pageCount, itemCount } = payload;

          if (itemCount === accountDeploysList?.length) return;

          const deploysListWithId = deploysList.map(deploy => ({
            ...deploy,
            id: deploy.deployHash
          }));

          dispatchToMainStore(accountDeploysUpdated(deploysListWithId));

          setAccountDeploysPageCount(pageCount);
          setAccountDeploysPage(accountDeploysPage + 1);

          if (accountDeploysCount !== itemCount) {
            dispatchToMainStore(accountDeploysCountChanged(itemCount));
          }
        }
      })
      .catch(handleError);
  }, [
    accountDeploysCount,
    accountDeploysList?.length,
    accountDeploysPage,
    accountDeploysPageCount,
    activeAccount?.publicKey
  ]);

  return {
    loadMoreDeploys,
    loading
  };
};
