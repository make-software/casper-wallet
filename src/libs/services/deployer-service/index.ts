import { CEP18Client } from 'casper-cep18-js-client';
import {
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  Keys,
  RuntimeArgs,
  decodeBase16
} from 'casper-js-sdk';
import { sub } from 'date-fns';

import {
  AuctionManagerEntryPoint,
  CasperNodeUrl,
  NetworkName,
  ReferrerUrl,
  STAKE_COST_MOTES,
  TRANSFER_COST_MOTES
} from '@src/constants';

import { getRawPublicKey } from '@libs/entities/Account';
import { toJson } from '@libs/services/utils';
import { Account } from '@libs/types/account';
import { CSPRtoMotes, multiplyErc20Balance } from '@libs/ui/utils';

import {
  ICasperNetworkSendDeployErrorResponse,
  ICasperNetworkSendDeployResponse,
  ICasperNodeStatusResponse
} from './types';

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
  const defaultDate = sub(new Date(), { seconds: 2 }).getTime();

  try {
    const casperNodeTimestamp: ICasperNodeStatusResponse = await fetch(
      `${nodeUrl}/info_get_status`,
      {
        referrer: ReferrerUrl
      }
    ).then(toJson);

    return casperNodeTimestamp?.last_progress
      ? new Date(casperNodeTimestamp?.last_progress).getTime()
      : defaultDate;
  } catch {
    return defaultDate;
  }
};

export const makeAuctionManagerDeployAndSing = async (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string,
  networkName: NetworkName,
  auctionManagerContractHash: string,
  nodeUrl: CasperNodeUrl,
  keys: Keys.AsymmetricKey[]
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

  const date = await getDateForDeploy(nodeUrl);

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

  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  return deploy.sign(keys);
};

export const makeNativeTransferDeployAndSign = async (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  networkName: NetworkName,
  nodeUrl: CasperNodeUrl,
  keys: Keys.AsymmetricKey[],
  transferIdMemo?: string
) => {
  const senderPublicKey = CLPublicKey.fromHex(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromHex(recipientPublicKeyHex);

  const date = await getDateForDeploy(nodeUrl);

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

  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  return deploy.sign(keys);
};

export const makeCep18TransferDeployAndSign = async (
  nodeUrl: CasperNodeUrl,
  networkName: NetworkName,
  tokenContractHash: string | undefined,
  tokenContractPackageHash: string | undefined,
  recipientPublicKey: string,
  amount: string,
  erc20Decimals: number | null,
  paymentAmount: string,
  activeAccount: Account,
  keys: Keys.AsymmetricKey[]
) => {
  const cep18 = new CEP18Client(nodeUrl, networkName);

  const date = await getDateForDeploy(nodeUrl);

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

  const deploy = DeployUtil.makeDeploy(
    deployParams,
    tempDeploy.session,
    tempDeploy.payment
  );

  return deploy.sign(keys);
};

export const makeNFTDeployAndSign = async (
  runtimeArgs: RuntimeArgs,
  paymentAmount: string,
  deploySender: CLPublicKey,
  networkName: NetworkName,
  contractPackageHash: string,
  nodeUrl: CasperNodeUrl,
  keys: Keys.AsymmetricKey[]
) => {
  const hash = Uint8Array.from(Buffer.from(contractPackageHash, 'hex'));

  const date = await getDateForDeploy(nodeUrl);

  const deployParams = new DeployUtil.DeployParams(
    deploySender,
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );
  const session =
    DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
      hash,
      null,
      'transfer',
      runtimeArgs
    );
  const payment = DeployUtil.standardPayment(paymentAmount);
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  return deploy.sign(keys);
};

export const sendSignDeploy = (
  deploy: DeployUtil.Deploy,
  nodeUrl: CasperNodeUrl
): Promise<
  ICasperNetworkSendDeployResponse | ICasperNetworkSendDeployErrorResponse
> => {
  const oneMegaByte = 1048576;
  const size = DeployUtil.deploySizeInBytes(deploy);

  if (size > oneMegaByte) {
    throw new Error(
      `Deploy can not be send, because it's too large: ${size} bytes. Max size is 1 megabyte.`
    );
  }

  return fetch(nodeUrl, {
    method: 'POST',
    referrer: ReferrerUrl,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'account_put_deploy',
      params: [DeployUtil.deployToJson(deploy).deploy],
      id: new Date().getTime()
    })
  }).then(toJson);
};
