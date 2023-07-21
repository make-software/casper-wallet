import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ExtendedDeployClTypeResult,
  ExtendedDeployWithId,
  MappedPendingTransaction
} from '@libs/services/account-activity-service';
import { deriveSplitDataFromNamedKeyValue } from '@src/utils';

export const getPublicKeyFormTarget = (
  target?: ExtendedDeployClTypeResult,
  publicKey?: string
) => {
  let toAccountPublicKey = '';

  if (target && target.cl_type === 'PublicKey') {
    toAccountPublicKey = target.parsed as string;
  } else {
    if (publicKey && target) {
      const activeAccountHash = getAccountHashFromPublicKey(publicKey);
      toAccountPublicKey =
        activeAccountHash === (target?.parsed as string)
          ? publicKey
          : (target?.parsed as string);
    }
  }

  return toAccountPublicKey;
};

export const getPublicKeyFormRecipient = (
  recipient: ExtendedDeployClTypeResult,
  publicKey?: string
) => {
  let toAccountPublicKey = '';

  if (recipient.cl_type === 'Key' && publicKey) {
    // @ts-ignore
    const accountHash = recipient.parsed?.Account;
    const activeAccountHash = getAccountHashFromPublicKey(publicKey);
    let { hash } = deriveSplitDataFromNamedKeyValue(accountHash);

    toAccountPublicKey = activeAccountHash === hash ? publicKey : hash;
  }

  return toAccountPublicKey;
};

export const getMappedPendingTransactions = (
  pendingTransactions: ExtendedDeployWithId[],
  publicKey: string
): MappedPendingTransaction[] =>
  pendingTransactions?.map(transaction => {
    const parsedAmount = (transaction?.args?.amount?.parsed as string) || '';

    const fromAccountPublicKey = transaction.callerPublicKey;
    const toAccountPublicKey = getPublicKeyFormTarget(
      transaction?.args?.target,
      publicKey
    );

    return {
      ...transaction,
      amount: parsedAmount,
      fromAccountPublicKey,
      toAccountPublicKey
    };
  });
