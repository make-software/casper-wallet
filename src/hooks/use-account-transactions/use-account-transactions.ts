import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchFetchAccountActivity } from '@libs/services/account-activity-service';
import { dispatchToMainStore } from '@background/redux/utils';
import {
  accountActivityChanged,
  accountActivityUpdated,
  accountErc20ActivityChanged,
  accountErc20ActivityUpdated
} from '@background/redux/account-info/actions';
import { selectAccountActivity } from '@background/redux/account-info/selectors';
import { useForceUpdate } from '@popup/hooks/use-force-update';
import {
  ACCOUNT_ACTIVITY_REFRESH_RATE,
  ActivityListTransactionsType
} from '@src/constants';
import { dispatchFetchErc20AccountActivity } from '@src/libs/services/account-activity-service/erc20-account-activity-service';

export const useAccountTransactions = (
  transactionsType: ActivityListTransactionsType
) => {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
  const activityList = useSelector(selectAccountActivity);

  const effectTimeoutRef = useRef<NodeJS.Timeout>();
  const forceUpdate = useForceUpdate();

  const activityListLength = activityList?.length || null;

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    // fetch all or casper
    if (
      transactionsType === ActivityListTransactionsType.All ||
      transactionsType === ActivityListTransactionsType.Casper
    ) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, 1)
        .then(
          ({
            payload: { data: accountTransactions, pageCount, itemCount }
          }) => {
            if (itemCount === activityListLength) return;

            const transactions =
              accountTransactions?.map(transaction => ({
                ...transaction,
                id: transaction.deploy_hash
              })) || null;

            dispatchToMainStore(accountActivityChanged(transactions));

            // Set page to 2, so we can fetch more transactions when the user scrolls down
            setPage(2);
            setPageCount(pageCount);
          }
        )
        .catch(error => {
          console.error('Account activity request failed:', error);
        });
    }
    // fetch all or erc20
    if (
      transactionsType === ActivityListTransactionsType.All ||
      transactionsType === ActivityListTransactionsType.Erc20
    ) {
      dispatchFetchErc20AccountActivity(activeAccount?.publicKey, 1)
        .then(
          ({
            payload: { data: accountTransactions, pageCount, itemCount }
          }) => {
            if (itemCount === activityListLength) return;

            const transactions =
              accountTransactions?.map(transaction => ({
                ...transaction,
                id: transaction.deploy_hash
              })) || null;

            dispatchToMainStore(accountErc20ActivityChanged(transactions));

            // Set page to 2, so we can fetch more transactions when the user scrolls down
            setPage(2);
            setPageCount(pageCount);
          }
        )
        .catch(error => {
          console.error('Account activity request failed:', error);
        });
    }

    // will cause effect to run again after timeout
    effectTimeoutRef.current = setTimeout(() => {
      forceUpdate();
    }, ACCOUNT_ACTIVITY_REFRESH_RATE + 1);

    return () => {
      clearTimeout(effectTimeoutRef.current);
    };
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.publicKey, casperApiUrl, forceUpdate]);

  const fetchMoreTransactions = useCallback(() => {
    if (!activeAccount?.publicKey) return;
    // Prevent fetching more transactions if we already fetched all of them
    if (page > pageCount) return;

    // fetch all or casper
    if (
      transactionsType === ActivityListTransactionsType.All ||
      transactionsType === ActivityListTransactionsType.Casper
    ) {
      dispatchFetchAccountActivity(activeAccount?.publicKey, page)
        .then(
          ({
            payload: { data: accountTransactions, pageCount, itemCount }
          }) => {
            if (itemCount === activityListLength) return;

            const transactions =
              accountTransactions?.map(transaction => ({
                ...transaction,
                id: transaction.deploy_hash
              })) || [];

            dispatchToMainStore(accountActivityUpdated(transactions));

            setPage(page + 1);
            setPageCount(pageCount);
          }
        )
        .catch(error => {
          console.error('Account activity request failed:', error);
        });
    }
    // fetch all or casper
    if (
      transactionsType === ActivityListTransactionsType.All ||
      transactionsType === ActivityListTransactionsType.Erc20
    ) {
      dispatchFetchErc20AccountActivity(activeAccount?.publicKey, page)
        .then(
          ({
            payload: { data: accountTransactions, pageCount, itemCount }
          }) => {
            if (itemCount === activityListLength) return;

            const transactions =
              accountTransactions?.map(transaction => ({
                ...transaction,
                id: transaction.deploy_hash
              })) || [];

            dispatchToMainStore(accountErc20ActivityUpdated(transactions));

            setPage(page + 1);
            setPageCount(pageCount);
          }
        )
        .catch(error => {
          console.error('Account activity request failed:', error);
        });
    }
  }, [
    activeAccount?.publicKey,
    activityListLength,
    page,
    pageCount,
    transactionsType
  ]);
  return {
    fetchMoreTransactions
  };
};
