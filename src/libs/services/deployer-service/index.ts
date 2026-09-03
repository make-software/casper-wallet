import { Conversions, Deploy, Transaction } from 'casper-js-sdk';
import {
  CasperNetwork,
  createLedgerSigner,
  createPrivateKeySigner
} from 'casper-wallet-core';

import { AuctionManagerEntryPoint, STAKE_COST_MOTES } from '@src/constants';
import { AsymmetricKeys } from '@src/libs/crypto/create-asymmetric-key';

import { casperTransactionsRepository } from '@background/signing-repositories';

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

export const getDateForDeploy = (network: CasperNetwork) =>
  casperTransactionsRepository.getDateForTransaction(network);

export const signTx = async (
  tx: Transaction,
  keys: AsymmetricKeys,
  activeAccount: Account,
  deployFallback?: Deploy,
  supportsTransactionV1Cb?: (
    publicKey: string,
    supports: boolean
  ) => Promise<void>
) => {
  if (activeAccount?.hardware === HardwareWalletType.Ledger) {
    const signer = createLedgerSigner({
      service: ledger,
      publicKeyHex: activeAccount.publicKey,
      derivationIndex: activeAccount.derivationIndex,
      supportsTransactionV1Cb
    });

    const signedTx = await signer.getSignedTransaction(tx, {
      fallbackDeploy: deployFallback
    });

    if (!signedTx.approvals[0]) {
      throw new Error('Invalid signature. Try to sign Transaction again');
    }

    return signedTx;
  }

  if (!keys.secretKey) {
    throw new Error('Missing secret key');
  }

  // The redux account carries no secret material outside the background: the page fetches the
  // key over the vault-secrets channel and hands it over as `keys`, so that is what signs.
  const signer = createPrivateKeySigner({
    publicKeyHex: activeAccount.publicKey,
    secretKeyBase64: Conversions.encodeBase64(keys.secretKey.toBytes())
  });

  return signer.getSignedTransaction(tx);
};

export const sendSignedTx = (
  tx: Transaction,
  network: CasperNetwork,
  casperNetworkApiVersion: string
) =>
  casperTransactionsRepository.sendSignedTransaction({
    transaction: tx,
    network,
    casperNetworkApiVersion
  });
