import { DeployUtil, Keys } from 'casper-js-sdk';
import { signDeploy } from './sign-deploy';

const getSignature = (
  hash: Uint8Array,
  keyPair: Keys.Ed25519 | Keys.Secp256K1
) => {
  const publicKeyHex = keyPair.publicKey.toHex(false);
  const privateKeyBase64 = Buffer.from(keyPair.privateKey).toString('base64');
  return signDeploy(hash, publicKeyHex, privateKeyBase64);
};

describe('sign-deploy', () => {
  const hash = Buffer.from(
    'cffc63f9c514bfc78c53852705f556b8a4fd5bfd6e073a66952ece942bdf19e0',
    'hex'
  );

  it('should get correct signature for Ed25519 keyPair', () => {
    const keyPair = Keys.Ed25519.new();
    const signature = getSignature(hash, keyPair);
    expect(keyPair.verify(signature, hash)).toBeTruthy();
  });

  it('should get correct signature for Secp256K1 keyPair', () => {
    const keyPair = Keys.Secp256K1.new();
    const signature = getSignature(hash, keyPair);
    expect(keyPair.verify(signature, hash)).toBeTruthy();
  });

  it('should set correct signature on the deploy with setSignature', () => {
    const signingKeyPair = Keys.Ed25519.new();
    const recipientKeyPair = Keys.Ed25519.new();
    const networkName = 'test-network';
    const paymentAmount = 10000000000000;
    const transferAmount = 10;
    const transferId = 34;

    let deployParams = new DeployUtil.DeployParams(
      signingKeyPair.publicKey,
      networkName
    );
    let session = DeployUtil.ExecutableDeployItem.newTransfer(
      transferAmount,
      recipientKeyPair.publicKey,
      undefined,
      transferId
    );
    let payment = DeployUtil.standardPayment(paymentAmount);
    let deploy = DeployUtil.makeDeploy(deployParams, session, payment);

    const signature = getSignature(deploy.hash, signingKeyPair);
    deploy = DeployUtil.setSignature(
      deploy,
      signature,
      signingKeyPair.publicKey
    );

    const approval = {
      signer: signingKeyPair.accountHex(),
      signature: Keys.Ed25519.accountHex(signature)
    };

    expect(deploy.approvals[0]).toEqual(approval);
  });
});
