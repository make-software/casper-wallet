import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import {
  LedgerLiveDeploysResult,
  dispatchFetchAccountActivity
} from '@libs/services/account-activity-service';

export const useAccountTransactions = () => {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [transactions, setTransactions] = useState<LedgerLiveDeploysResult[]>(
    []
  );

  const observerElement = useRef(null);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    dispatchFetchAccountActivity(activeAccount?.publicKey, 1)
      .then(({ payload: { data: accountTransactions, pageCount } }) => {
        setTransactions(accountTransactions);

        // Set page to 2, so we can fetch more transactions when the user scrolls down
        setPage(2);
        setPageCount(pageCount);
      })
      .catch(error => {
        console.error('Account activity request failed:', error);
      });
  }, [activeAccount?.publicKey, casperApiUrl]);

  const fetchMoreTransactions = useCallback(() => {
    if (!activeAccount?.publicKey) return;

    dispatchFetchAccountActivity(activeAccount?.publicKey, page)
      .then(({ payload: { data: accountTransactions, pageCount } }) => {
        const newTransactions = [...transactions, ...accountTransactions];

        setTransactions(newTransactions);

        setPage(page + 1);
        setPageCount(pageCount);
      })
      .catch(error => {
        console.error('Account activity request failed:', error);
      });
  }, [activeAccount?.publicKey, page, transactions]);

  const handleObserver = useCallback(
    entries => {
      const [target] = entries;

      if (target.isIntersecting && page <= pageCount) {
        fetchMoreTransactions();
      }
    },
    [fetchMoreTransactions, page, pageCount]
  );

  useEffect(() => {
    const element = observerElement.current;
    const option = { threshold: 0 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element != null) {
      observer.observe(element);
    }
    return () => {
      if (element != null) {
        return observer.unobserve(element);
      }
    };
  }, [fetchMoreTransactions, handleObserver]);

  return {
    transactions: transactions.map(transaction => ({
      ...transaction,
      id: transaction.deploy_hash
    })),
    observerElement
  };
};
