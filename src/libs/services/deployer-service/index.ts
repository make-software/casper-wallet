import { Deploy, HttpHandler, RpcClient, Transaction } from 'casper-js-sdk';
import { isBefore, sub } from 'date-fns';

import {
  AuctionManagerEntryPoint,
  CasperNodeUrl,
  REFERRER_URL,
  STAKE_COST_MOTES
} from '@src/constants';
import { AsymmetricKeys } from '@src/libs/crypto/create-asymmetric-key';

import { Account, HardwareWalletType } from '@libs/types/account';

import { ledger } from '../ledger';

export const getAuctionManagerDeployCost = (
  entryPoint: AuctionManagerEntryPoint
) => {
  switch (entryPoint) {
    case AuctionManagerEntryPoint.delegate:
    case AuctionManagerEntryPoint.undelegate:
    case AuctionManagerEntryPoint.redelegate:
      return STAKE_COST_MOTES;

    default:
      throw Error('getAuctionManagerDeployCost: unknown entry point');
  }
};

export const getDateForDeploy = async (nodeUrl: CasperNodeUrl) => {
  const defaultDate = sub(new Date(), { seconds: 2 });
  const handler = new HttpHandler(nodeUrl, 'fetch');
  handler.setReferrer(REFERRER_URL);
  const rpcClient = new RpcClient(handler);

  try {
    const resp = await rpcClient.getStatus();

    const nodeDate = resp.lastProgress.toDate();

    return isBefore(nodeDate, defaultDate)
      ? defaultDate.toISOString()
      : nodeDate.toISOString();
  } catch {
    return defaultDate.toISOString();
  }
};

export const signTx = async (
  tx: Transaction,
  keys: AsymmetricKeys,
  activeAccount: Account,
  deployFallback?: Deploy
) => {
  if (activeAccount?.hardware === HardwareWalletType.Ledger) {
    const signedTx = await ledger.getSignedTransaction(
      tx,
      {
        publicKey: activeAccount.publicKey,
        index: activeAccount.derivationIndex
      },
      deployFallback ? Transaction.fromDeploy(deployFallback) : undefined
    );
    const approval = signedTx.approvals[0];

    if (!approval) {
      throw new Error('Invalid signature. Try to sign Transaction again');
    }

    return signedTx;
  }

  if (!keys.secretKey) {
    throw new Error('Missing secret key');
  }

  tx.sign(keys.secretKey);

  return tx;
};

export const sendSignedTx = async (
  tx: Transaction,
  nodeUrl: CasperNodeUrl,
  isCasper2Network: boolean
): Promise<string> => {
  const handler = new HttpHandler(nodeUrl, 'fetch');
  handler.setReferrer(REFERRER_URL);
  const rpcClient = new RpcClient(handler);

  if (isCasper2Network) {
    const txResp = await rpcClient.putTransaction(tx);

    return txResp.transactionHash.toHex();
  }

  const deploy = tx.getDeploy();

  if (deploy) {
    const deployResp = await rpcClient.putDeploy(deploy);

    return deployResp.deployHash.toHex();
  }

  throw new Error('Invalid Transaction object');
};
