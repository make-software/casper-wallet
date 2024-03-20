import { CEP18Client } from 'casper-cep18-js-client';
import {
  CLPublicKey,
  CLValueBuilder,
  CasperServiceByJsonRPC,
  DeployUtil,
  RuntimeArgs,
  decodeBase16
} from 'casper-js-sdk';

import {
  AuctionManagerEntryPoint,
  CasperNodeUrl,
  NetworkName,
  STAKE_COST_MOTES,
  TRANSFER_COST_MOTES
} from '@src/constants';

import { signDeploy } from '@libs/crypto';
import { getRawPublicKey } from '@libs/entities/Account';
import { handleError, toJson } from '@libs/services/utils';
import { Account } from '@libs/types/account';
import { CSPRtoMotes, multiplyErc20Balance } from '@libs/ui/utils';

import { RPCErrorResponse, RPCResponse } from './types';

const casperService = (url: string) => new CasperServiceByJsonRPC(url);

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

export const getCasperNodeTimestamp = async (): Promise<string> =>
  fetch('https://casper-node-proxy.make.services/status')
    .then(toJson)
    .then(resp => resp.last_progress)
    .catch(handleError);

export const getDateForDeploy = async () => {
  const casperNodeTimestamp = await getCasperNodeTimestamp();

  return new Date(casperNodeTimestamp).getTime();
};

export const signAndDeploy = (
  deploy: DeployUtil.Deploy,
  senderPublicKeyHex: string,
  senderSecretKeyHex: string,
  url: string
): Promise<RPCResponse | RPCErrorResponse> => {
  const signature = signDeploy(
    deploy.hash,
    senderPublicKeyHex,
    senderSecretKeyHex
  );

  const signedDeploy = DeployUtil.setSignature(
    deploy,
    signature,
    CLPublicKey.fromHex(senderPublicKeyHex)
  );

  return casperService(url)
    .deploy(signedDeploy)
    .catch((error: RPCErrorResponse) => {
      console.error(error, 'deploy request error');
      return error;
    });
};

export const makeAuctionManagerDeploy = async (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string,
  networkName: NetworkName,
  auctionManagerContractHash: string
) => {
  const hash = decodeBase16(auctionManagerContractHash);

  const delegatorPublicKey = getRawPublicKey(delegatorPublicKeyHex);
  const validatorPublicKey = getRawPublicKey(validatorPublicKeyHex);
  const newValidatorPublicKey =
    redelegateValidatorPublicKeyHex &&
    getRawPublicKey(redelegateValidatorPublicKeyHex);

  const runtimeArgs = RuntimeArgs.fromMap({
    validator: validatorPublicKey,
    delegator: delegatorPublicKey,
    amount: CLValueBuilder.u512(amountMotes),
    ...(newValidatorPublicKey && {
      new_validator: newValidatorPublicKey
    })
  });

  const date = await getDateForDeploy();

  const deployParams = new DeployUtil.DeployParams(
    delegatorPublicKey,
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    hash,
    contractEntryPoint,
    runtimeArgs
  );

  const deployCost = getAuctionManagerDeployCost(contractEntryPoint);

  const payment = DeployUtil.standardPayment(deployCost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const makeCep18TransferDeploy = async (
  nodeUrl: CasperNodeUrl,
  networkName: NetworkName,
  tokenContractHash: string | undefined,
  tokenContractPackageHash: string | undefined,
  recipientPublicKey: string,
  amount: string,
  erc20Decimals: number | null,
  paymentAmount: string,
  activeAccount: Account
) => {
  const cep18 = new CEP18Client(nodeUrl, networkName);

  const date = await getDateForDeploy();

  cep18.setContractHash(
    `hash-${tokenContractHash}`,
    `hash-${tokenContractPackageHash}`
  );

  // create deploy
  const tempDeploy = cep18.transfer(
    {
      recipient: getRawPublicKey(recipientPublicKey),
      amount: multiplyErc20Balance(amount, erc20Decimals) || '0'
    },
    CSPRtoMotes(paymentAmount),
    getRawPublicKey(activeAccount.publicKey),
    networkName
  );

  const deployParams = new DeployUtil.DeployParams(
    getRawPublicKey(activeAccount.publicKey),
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );

  return DeployUtil.makeDeploy(
    deployParams,
    tempDeploy.session,
    tempDeploy.payment
  );
};

export const makeNativeTransferDeploy = async (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  networkName: NetworkName,
  transferIdMemo?: string
) => {
  const senderPublicKey = CLPublicKey.fromHex(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromHex(recipientPublicKeyHex);

  const date = await getDateForDeploy();

  const deployParams = new DeployUtil.DeployParams(
    senderPublicKey,
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );

  const session =
    DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
      amountMotes,
      recipientPublicKey,
      undefined,
      transferIdMemo || undefined
    );

  const payment = DeployUtil.standardPayment(TRANSFER_COST_MOTES);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};
