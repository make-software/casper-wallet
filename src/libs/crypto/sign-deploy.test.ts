import {
  CasperNetworkName,
  Conversions,
  Deploy,
  KeyAlgorithm,
  PrivateKey,
  makeCsprTransferDeploy
} from 'casper-js-sdk';

import { AsymmetricKeys } from '@libs/crypto/create-asymmetric-key';

import { signDeploy } from './sign-deploy';

const getSignature = (hash: Uint8Array, keyPair: AsymmetricKeys) => {
  const publicKeyHex = keyPair.publicKey.toHex(false);
  const privateKeyBase64 = Conversions.encodeBase64(
    keyPair.secretKey.toBytes()
  );
  return signDeploy(hash, publicKeyHex, privateKeyBase64);
};

describe('sign-deploy', () => {
  const hash = Buffer.from(
    'cffc63f9c514bfc78c53852705f556b8a4fd5bfd6e073a66952ece942bdf19e0',
    'hex'
  );

  it('should get correct signature for Ed25519 keyPair', async () => {
    const privateKey = await PrivateKey.generate(KeyAlgorithm.ED25519);
    const keyPair: AsymmetricKeys = {
      secretKey: privateKey,
      publicKey: privateKey.publicKey
    };
    const signature = await getSignature(hash, keyPair);
    await expect(
      keyPair.publicKey.verifySignature(hash, signature)
    ).resolves.toBeTruthy();
  });

  it('should get correct signature for Secp256K1 keyPair', async () => {
    const privateKey = await PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const keyPair: AsymmetricKeys = {
      secretKey: privateKey,
      publicKey: privateKey.publicKey
    };
    const signature = await getSignature(hash, keyPair);
    await expect(
      keyPair.publicKey.verifySignature(hash, signature)
    ).resolves.toBeTruthy();
  });

  it('should set correct signature on the deploy with setSignature', async () => {
    const signingPrivateKey = await PrivateKey.generate(KeyAlgorithm.ED25519);
    const recipientPrivateKey = await PrivateKey.generate(KeyAlgorithm.ED25519);

    const getSignedDeployApproval = async () => {
      let deploy = makeCsprTransferDeploy({
        transferAmount: '1000000000',
        memo: '34',
        chainName: CasperNetworkName.Testnet,
        senderPublicKeyHex: signingPrivateKey.publicKey.toHex(),
        recipientPublicKeyHex: recipientPrivateKey.publicKey.toHex()
      });

      const signature = await getSignature(deploy.hash.toBytes(), {
        publicKey: signingPrivateKey.publicKey,
        secretKey: signingPrivateKey
      });

      deploy = Deploy.setSignature(
        deploy,
        signature,
        signingPrivateKey.publicKey
      );

      return deploy.approvals[0].signer;
    };

    await expect(getSignedDeployApproval()).resolves.toEqual(
      signingPrivateKey.publicKey
    );
  });
});
