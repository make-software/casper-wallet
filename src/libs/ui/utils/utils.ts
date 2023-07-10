import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ExtendedDeployClTypeResult,
  ExtendedDeployWithId,
  MappedPendingTransaction
} from '@libs/services/account-activity-service';

export const getPublicKeyFormTarget = (
  target?: ExtendedDeployClTypeResult,
  publicKey?: string
) => {
  let toAccountPublicKey = '';

  if (target && target.cl_type === 'PublicKey') {
    // sometimes we receive the public key in uppercase
    toAccountPublicKey = target.parsed as string;
  } else {
    if (publicKey && target) {
      const activeAccountHash = getAccountHashFromPublicKey(publicKey);
      toAccountPublicKey =
        activeAccountHash === (target.parsed as string)
          ? publicKey
          : (target.parsed as string);
    }
  }

  return toAccountPublicKey;
};

export const getMappedPendingTransactions = (
  pendingTransactions: ExtendedDeployWithId[],
  publicKey: string
): MappedPendingTransaction[] =>
  pendingTransactions?.map(transaction => {
    const parsedAmount = (transaction.args.amount?.parsed as string) || '';

    const fromAccountPublicKey = transaction.callerPublicKey;
    const toAccountPublicKey = getPublicKeyFormTarget(
      transaction.args.target,
      publicKey
    );

    return {
      ...transaction,
      amount: parsedAmount,
      fromAccountPublicKey,
      toAccountPublicKey
    };
  });
