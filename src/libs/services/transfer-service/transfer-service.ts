import { CasperServiceByJsonRPC, CLPublicKey, DeployUtil } from 'casper-js-sdk';

import { signDeploy } from '@libs/crypto';
import { GrpcUrl, NetworkName, TRANSFER_COST } from '@src/constants';

const casperService = (url: string) => new CasperServiceByJsonRPC(url);

export const makeNativeTransferDeploy = (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  networkName: NetworkName,
  transferIdMemo?: string
) => {
  const senderPublicKey = CLPublicKey.fromHex(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromHex(recipientPublicKeyHex);

  const deployParams = new DeployUtil.DeployParams(
    senderPublicKey,
    networkName
  );

  const session =
    DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
      amountMotes,
      recipientPublicKey,
      undefined,
      transferIdMemo || undefined
    );

  const payment = DeployUtil.standardPayment(TRANSFER_COST);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const signAndDeploy = (
  deploy: DeployUtil.Deploy,
  senderPublicKeyHex: string,
  senderSecretKeyHex: string,
  url: GrpcUrl
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

  return casperService(url)
    .deploy(signedDeploy)
    .then(res => res)
    .catch(error => {
      console.log(error);
    });
};
