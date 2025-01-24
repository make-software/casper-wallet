import { concatBytes } from '@noble/ciphers/utils';
import {
  CasperNetworkName,
  Conversions,
  Deploy,
  KeyAlgorithm,
  PrivateKey,
  makeCsprTransferDeploy
} from 'casper-js-sdk';

import { AsymmetricKeys } from '@libs/crypto/create-asymmetric-key';

import { signDeployForProviderResponse } from './sign-deploy';

const getSignature = (hash: Uint8Array, keyPair: AsymmetricKeys) => {
  const publicKeyHex = keyPair.publicKey.toHex(false);
  const privateKeyBase64 = Conversions.encodeBase64(
    keyPair.secretKey!.toBytes()
  );
  return signDeployForProviderResponse(hash, publicKeyHex, privateKeyBase64);
};

describe('sign-deploy', () => {
  const hash = Buffer.from(
    'cffc63f9c514bfc78c53852705f556b8a4fd5bfd6e073a66952ece942bdf19e0',
    'hex'
  );

  it('should get correct signature for Ed25519 keyPair', () => {
    const privateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const keyPair: AsymmetricKeys = {
      secretKey: privateKey,
      publicKey: privateKey.publicKey
    };
    const signature = getSignature(hash, keyPair);
    const algBytes = Uint8Array.of(privateKey.publicKey.cryptoAlg);
    expect(
      keyPair.publicKey.verifySignature(hash, concatBytes(algBytes, signature))
    ).toBeTruthy();
  });

  it('should get correct signature for Secp256K1 keyPair', () => {
    const privateKey = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const keyPair: AsymmetricKeys = {
      secretKey: privateKey,
      publicKey: privateKey.publicKey
    };
    const algBytes = Uint8Array.of(privateKey.publicKey.cryptoAlg);
    const signature = getSignature(hash, keyPair);
    expect(
      keyPair.publicKey.verifySignature(hash, concatBytes(algBytes, signature))
    ).toBeTruthy();
  });

  it('should set correct signature on the deploy with setSignature', () => {
    const signingPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const recipientPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);

    const getSignedDeployApproval = () => {
      let deploy = makeCsprTransferDeploy({
        transferAmount: '1000000000',
        memo: '34',
        chainName: CasperNetworkName.Testnet,
        senderPublicKeyHex: signingPrivateKey.publicKey.toHex(),
        recipientPublicKeyHex: recipientPrivateKey.publicKey.toHex()
      });

      const signature = getSignature(deploy.hash.toBytes(), {
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

    expect(getSignedDeployApproval()).toEqual(signingPrivateKey.publicKey);
  });
});
