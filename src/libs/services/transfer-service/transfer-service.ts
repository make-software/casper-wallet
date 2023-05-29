import { CLPublicKey, DeployUtil } from 'casper-js-sdk';

import { NetworkName, TRANSFER_COST_MOTES } from '@src/constants';

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

  const payment = DeployUtil.standardPayment(TRANSFER_COST_MOTES);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};
