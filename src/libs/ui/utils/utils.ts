import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  Erc20TransferWithId,
  ExtendedDeployArgsResult,
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
  } else if (publicKey && target) {
    const activeAccountHash = getAccountHashFromPublicKey(publicKey);

    toAccountPublicKey =
      activeAccountHash === (target?.parsed as string)
        ? publicKey
        : (target?.parsed as string);
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

const getRecipientAddressFromDeployArgs = (
  args: ExtendedDeployArgsResult,
  activePublicKey: string
) => {
  if (args?.target) {
    return getPublicKeyFormTarget(args.target, activePublicKey);
  } else if (args?.recipient) {
    return getPublicKeyFormRecipient(args.recipient, activePublicKey);
  } else if (args?.new_validator) {
    return args?.new_validator.cl_type === 'PublicKey'
      ? (args?.new_validator.parsed as string)
      : '';
  } else if (args?.validator) {
    return args?.validator.cl_type === 'PublicKey'
      ? (args?.validator.parsed as string)
      : '';
  } else {
    return 'N/A';
  }
};

export const getRecipientAddressFromTransaction = (
  transaction: ExtendedDeployWithId | Erc20TransferWithId,
  activePublicKey: string
) => {
  let toAccountPublicKey = '';
  let toAccountHash = '';

  // check if the transaction is an erc20 transfer
  if ('toPublicKey' in transaction) {
    if (transaction?.toPublicKey != null) {
      toAccountPublicKey = transaction?.toPublicKey;
    } else if (transaction?.toType === 'account-hash' && transaction?.toHash) {
      toAccountHash = transaction.toHash;
    }
  } else {
    toAccountPublicKey = getRecipientAddressFromDeployArgs(
      transaction?.args,
      activePublicKey
    );
  }

  return {
    recipientAddress: toAccountPublicKey || toAccountHash
  };
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
