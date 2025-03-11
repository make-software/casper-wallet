import { Transaction } from 'casper-js-sdk';

import {
  getTxArgs,
  getTxContractHash,
  getTxContractName,
  getTxEntryPoint,
  getTxPayment,
  getTxType
} from './utils';

export function deriveDeployInfoFromDeployRaw(tx: Transaction) {
  return {
    account:
      tx.initiatorAddr.publicKey?.toHex() ??
      tx.initiatorAddr.accountHash?.toHex() ??
      '',
    deployHash: tx.hash.toHex(),
    timestamp: tx.timestamp.toMilliseconds().toString(),
    chainName: tx.chainName,
    payment: getTxPayment(tx),
    deployType: getTxType(tx),
    deployArgs: getTxArgs(tx),
    contractHash: getTxContractHash(tx),
    contractName: getTxContractName(tx),
    entryPoint: getTxEntryPoint(tx)
  };
}
