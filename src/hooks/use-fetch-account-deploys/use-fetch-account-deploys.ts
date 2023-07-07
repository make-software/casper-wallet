import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { useForceUpdate } from '@popup/hooks/use-force-update';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { dispatchFetchAccountExtendedDeploys } from '@libs/services/account-activity-service';
import {
  accountDeploysChanged,
  accountDeploysUpdated
} from '@background/redux/account-info/actions';
import { dispatchToMainStore } from '@background/redux/utils';
import { ACCOUNT_DEPLOY_REFRESH_RATE } from '@src/constants';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

export const useFetchAccountDeploys = () => {
  const [accountDeploysPage, setAccountDeploysPage] = useState(1);
  const [accountDeploysPageCount, setAccountDeploysPageCount] = useState(0);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  const handleError = (error: Error) => {
    console.error('Account deploys request failed:', error);
  };

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    dispatchFetchAccountExtendedDeploys(activeAccount?.publicKey, 1)
      .then(({ payload: { data: accountDeploys, pageCount } }) => {
        const transactions =
          accountDeploys?.map(transaction => ({
            ...transaction,
            id: transaction.deploy_hash
          })) || [];

        dispatchToMainStore(accountDeploysChanged(transactions));

        // Set page to 2, so we can fetch more transactions when the user scrolls down
        setAccountDeploysPage(accountDeploysPage + 1);
        setAccountDeploysPageCount(pageCount);
      })
      .catch(handleError);

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_DEPLOY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, forceUpdate]);

  const fetchMoreTransactions = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    if (accountDeploysPage > accountDeploysPageCount) return;

    dispatchFetchAccountExtendedDeploys(
      activeAccount?.publicKey,
      accountDeploysPage
    )
      .then(({ payload: { data: accountDeploys, pageCount } }) => {
        const transactions =
          accountDeploys?.map(transaction => ({
            ...transaction,
            id: transaction.deploy_hash
          })) || [];

        dispatchToMainStore(accountDeploysUpdated(transactions));

        // Set page to 2, so we can fetch more transactions when the user scrolls down
        setAccountDeploysPage(accountDeploysPage + 1);
        setAccountDeploysPageCount(pageCount);
      })
      .catch(handleError);
  }, [accountDeploysPage, accountDeploysPageCount, activeAccount?.publicKey]);

  return {
    fetchMoreTransactions
  };
};
