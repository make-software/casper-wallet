import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  dispatchFetchAccountTransactions,
  Transaction
} from '@libs/services/transactions-service';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

export const useAccountTransactions = () => {
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const observerElem = useRef(null);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    dispatchFetchAccountTransactions(
      getAccountHashFromPublicKey(activeAccount?.publicKey),
      1
    )
      .then(({ payload: { data: accountTransactions, pageCount } }) => {
        setTransactions(accountTransactions);

        setPage(2);
        setPageCount(pageCount);
      })
      .catch(error => {
        console.error('Account transactions request failed:', error);
      });
  }, [activeAccount?.publicKey, casperApiUrl]);

  const fetchMoreTransactions = useCallback(() => {
    dispatchFetchAccountTransactions(
      getAccountHashFromPublicKey(activeAccount?.publicKey),
      page
    )
      .then(({ payload: { data: accountTransactions, pageCount } }) => {
        const newTransactions = [...transactions, ...accountTransactions];

        setTransactions(newTransactions);

        setPage(page + 1);
        setPageCount(pageCount);
      })
      .catch(error => {
        console.error('Account transactions request failed:', error);
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
    const element = observerElem.current;
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
      id: transaction.deployHash
    })),
    observerElem
  };
};
