import {
  CLPublicKey,
  CLValueBuilder,
  CasperServiceByJsonRPC,
  DeployUtil,
  RuntimeArgs,
  decodeBase16
} from 'casper-js-sdk';
import { sub } from 'date-fns';

import { AuctionManagerEntryPoint, STAKE_COST_MOTES } from '@src/constants';

import { signDeploy } from '@libs/crypto';
import { getRawPublicKey } from '@libs/entities/Account';

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
    CLPublicKey.fromHex(
      '02028a04ab5ff8435f19581484643cadfd755ee9f0985e402d646ae6f3bd040912f5'
    )
  );

  return casperService(url)
    .deploy(signedDeploy)
    .catch((error: RPCErrorResponse) => {
      console.error(error, 'deploy request error');
      return error;
    });
};

export const makeAuctionManagerDeploy = (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string,
  networkName: string,
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

  const deployParams = new DeployUtil.DeployParams(
    delegatorPublicKey,
    networkName,
    undefined,
    undefined,
    undefined,
    sub(new Date(), { seconds: 2 }).getTime()
  ); // https://github.com/casper-network/casper-node/issues/4152

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    hash,
    contractEntryPoint,
    runtimeArgs
  );

  const deployCost = getAuctionManagerDeployCost(contractEntryPoint);

  const payment = DeployUtil.standardPayment(deployCost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};
