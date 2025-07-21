import {
  Deploy,
  makeAuctionManagerDeploy,
  makeAuctionManagerTransaction,
  makeCep18TransferDeploy,
  makeCep18TransferTransaction,
  makeCsprTransferDeploy,
  makeCsprTransferTransaction
} from 'casper-js-sdk';
import { IMakeAuctionManagerDeployParams } from 'casper-js-sdk/dist/utils/auction-manager';
import { IMakeCep18TransferDeployParams } from 'casper-js-sdk/dist/utils/cep-18-transfer';
import { IMakeNftTransferDeployParams } from 'casper-js-sdk/dist/utils/cep-nft-transfer';
import { IMakeCsprTransferDeployParams } from 'casper-js-sdk/dist/utils/cspr-transfer';
import {
  NFTTokenStandard,
  makeNftTransferTransaction
} from 'casper-wallet-core';

export const buildCep18Transactions = (
  {
    chainName,
    contractPackageHash,
    paymentAmount,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    transferAmount,
    timestamp
  }: IMakeCep18TransferDeployParams,
  casperNetworkApiVersion: string
) => {
  const transaction = makeCep18TransferTransaction({
    chainName,
    contractPackageHash,
    paymentAmount,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    transferAmount,
    timestamp,
    casperNetworkApiVersion,
    gasPrice: 3
  });

  // required for old Ledger apps
  const fallbackDeploy = makeCep18TransferDeploy({
    chainName,
    contractPackageHash,
    paymentAmount,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    transferAmount,
    timestamp
  });

  return { transaction, fallbackDeploy };
};

export const buildCsprTransferTransactions = (
  {
    chainName,
    memo,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    transferAmount,
    timestamp
  }: IMakeCsprTransferDeployParams,
  casperNetworkApiVersion: string
) => {
  const transaction = makeCsprTransferTransaction({
    chainName,
    memo: memo || Date.now().toString(),
    recipientPublicKeyHex,
    senderPublicKeyHex,
    transferAmount,
    timestamp,
    casperNetworkApiVersion,
    gasPrice: 3
  });

  // required for old Ledger apps
  const fallbackDeploy = makeCsprTransferDeploy({
    chainName,
    memo: memo || Date.now().toString(),
    recipientPublicKeyHex,
    senderPublicKeyHex,
    transferAmount,
    timestamp
  });

  return { transaction, fallbackDeploy };
};

export const buildAuctionTransactions = (
  {
    chainName,
    newValidatorPublicKeyHex,
    validatorPublicKeyHex,
    contractEntryPoint,
    delegatorPublicKeyHex,
    amount,
    timestamp
  }: IMakeAuctionManagerDeployParams,
  casperNetworkApiVersion: string
) => {
  const transaction = makeAuctionManagerTransaction({
    amount,
    chainName,
    contractEntryPoint,
    delegatorPublicKeyHex,
    newValidatorPublicKeyHex,
    validatorPublicKeyHex,
    timestamp,
    casperNetworkApiVersion,
    gasPrice: 3
  });

  // required for old Ledger apps
  const fallbackDeploy = makeAuctionManagerDeploy({
    amount,
    chainName,
    contractEntryPoint,
    delegatorPublicKeyHex,
    newValidatorPublicKeyHex,
    validatorPublicKeyHex,
    timestamp
  });

  return { transaction, fallbackDeploy };
};

interface IBuildNftTransferTransactionsParams
  extends Omit<IMakeNftTransferDeployParams, 'nftStandard'> {
  nftStandard: NFTTokenStandard;
}

export const buildNftTransferTransactions = (
  {
    chainName,
    contractPackageHash,
    nftStandard,
    paymentAmount,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    tokenId,
    tokenHash,
    timestamp
  }: IBuildNftTransferTransactionsParams,
  casperNetworkApiVersion: string
) => {
  const transaction = makeNftTransferTransaction({
    chainName,
    contractPackageHash,
    nftStandard,
    paymentAmount,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    tokenId,
    tokenHash,
    timestamp,
    casperNetworkApiVersion,
    gasPrice: 3
  });

  // required for old Ledger apps
  const fallbackDeploy = makeNftTransferTransaction({
    chainName,
    contractPackageHash,
    nftStandard,
    paymentAmount,
    recipientPublicKeyHex,
    senderPublicKeyHex,
    tokenId,
    tokenHash,
    timestamp,
    casperNetworkApiVersion: '1.5.8',
    gasPrice: 3
  });

  return { transaction, fallbackDeploy: fallbackDeploy.getDeploy() as Deploy };
};
