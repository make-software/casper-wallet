import { CasperServiceByJsonRPC, CLPublicKey, DeployUtil } from 'casper-js-sdk';

import { signDeploy } from '@libs/crypto';
import {
  GRPC_URL,
  NETWORK_NAME,
  TRANSFER_COST
} from '@libs/services/transfer-service/constants';

const casperService = new CasperServiceByJsonRPC(GRPC_URL);

export const makeNativeTransferDeploy = (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  transferIdMemo: string
) => {
  const senderPublicKey = CLPublicKey.fromHex(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromHex(recipientPublicKeyHex);

  const deployParams = new DeployUtil.DeployParams(
    senderPublicKey,
    NETWORK_NAME
  );

  const session = DeployUtil.ExecutableDeployItem.newTransfer(
    amountMotes,
    recipientPublicKey,
    undefined,
    transferIdMemo
  );

  const payment = DeployUtil.standardPayment(TRANSFER_COST);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const signAndDeploy = (
  deploy: DeployUtil.Deploy,
  senderPublicKeyHex: string,
  senderSecretKeyHex: string
) => {
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

  casperService
    .deploy(signedDeploy)
    .then(res => {
      return res;
    })
    .catch(error => {
      console.log(error);
    });
};
