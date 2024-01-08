import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { accountPendingTransactionsRemove } from '@background/redux/account-info/actions';
import { selectPendingTransactions } from '@background/redux/account-info/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { ExtendedDeployWithId } from '@libs/services/account-activity-service';
import { getMappedPendingTransactions } from '@libs/ui/utils/utils';

export const useMapAccountDeploysListWithPendingTransactions = (
  accountDeploys: ExtendedDeployWithId[] | null
) => {
  const pendingTransactions = useSelector(selectPendingTransactions);
  const activeAccount = useSelector(selectVaultActiveAccount);

  const mappedPendingTransactions = getMappedPendingTransactions(
    pendingTransactions,
    activeAccount?.publicKey || ''
  );

  // validated pending transactions
  const filteredTransactions = useMemo(() => {
    return mappedPendingTransactions?.filter(pendingTransaction => {
      if (accountDeploys != null) {
        const transaction = accountDeploys?.find(
          deploy => deploy.deployHash === pendingTransaction.deployHash
        );

        if (transaction) {
          dispatchToMainStore(
            accountPendingTransactionsRemove(transaction?.deployHash)
          );
        }

        return !transaction;
      }

      return true;
    });
  }, [accountDeploys, mappedPendingTransactions]);

  const accountDeploysListWithPendingTransactions =
    accountDeploys != null
      ? [...filteredTransactions, ...accountDeploys]
      : mappedPendingTransactions.length > 0
        ? mappedPendingTransactions
        : null;

  return {
    accountDeploysListWithPendingTransactions
  };
};
