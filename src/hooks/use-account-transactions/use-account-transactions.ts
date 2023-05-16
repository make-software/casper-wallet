import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import {
  dispatchFetchAccountTransactions,
  Transaction
} from '@libs/services/transactions-service';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

export const useAccountTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    dispatchFetchAccountTransactions(
      getAccountHashFromPublicKey(activeAccount?.publicKey)
    )
      .then(({ payload: accountTransactions }) => {
        setTransactions(accountTransactions);
      })
      .catch(error => {
        console.error('Account transactions request failed:', error);
      });
  }, [activeAccount?.publicKey, casperApiUrl]);

  return {
    transactions: transactions.map(transaction => ({
      ...transaction,
      id: transaction.deployHash
    }))
  };
};
