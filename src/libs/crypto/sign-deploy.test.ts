import { concatBytes } from '@noble/ciphers/utils.js';
import {
  Conversions,
  Deploy,
  KeyAlgorithm,
  PrivateKey,
  Transaction
} from 'casper-js-sdk';
import {
  KeyPairMismatchError,
  buildCsprTransferTransactions,
  createPrivateKeySigner
} from 'casper-wallet-core';

const signWith = async (
  publicKeyHex: string,
  privateKeyBase64: string,
  tx: Transaction
) => {
  const signer = createPrivateKeySigner({
    publicKeyHex,
    secretKeyBase64: privateKeyBase64
  });
  const { signature } = await signer.signTransaction(tx);

  return signature; // raw, unprefixed — exactly what the dApp receives
};

const buildTransferDeploy = (senderPrivateKey: PrivateKey) =>
  buildCsprTransferTransactions(
    {
      network: 'testnet',
      transferAmountMotes: '1000000000',
      memo: '34',
      senderPublicKeyHex: senderPrivateKey.publicKey.toHex(),
      recipientPublicKeyHex: PrivateKey.generate(
        KeyAlgorithm.ED25519
      ).publicKey.toHex()
    },
    '1.5.8'
  ).fallbackDeploy;

describe('sign-deploy', () => {
  it('should get correct signature for Ed25519 keyPair', async () => {
    const privateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const tx = Transaction.fromDeploy(buildTransferDeploy(privateKey));
    const privateKeyBase64 = Conversions.encodeBase64(privateKey.toBytes());

    const signature = await signWith(
      privateKey.publicKey.toHex(),
      privateKeyBase64,
      tx
    );
    const algBytes = Uint8Array.of(privateKey.publicKey.cryptoAlg);

    expect(
      privateKey.publicKey.verifySignature(
        tx.hash.toBytes(),
        concatBytes(algBytes, signature)
      )
    ).toBeTruthy();
  });

  it('should get correct signature for Secp256K1 keyPair', async () => {
    const privateKey = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const tx = Transaction.fromDeploy(buildTransferDeploy(privateKey));
    const privateKeyBase64 = Conversions.encodeBase64(privateKey.toBytes());

    const signature = await signWith(
      privateKey.publicKey.toHex(),
      privateKeyBase64,
      tx
    );
    const algBytes = Uint8Array.of(privateKey.publicKey.cryptoAlg);

    expect(
      privateKey.publicKey.verifySignature(
        tx.hash.toBytes(),
        concatBytes(algBytes, signature)
      )
    ).toBeTruthy();
  });

  it('should set correct signature on the deploy with setSignature', async () => {
    const signingPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);

    const getSignedDeployApproval = async () => {
      let deploy = buildTransferDeploy(signingPrivateKey);
      const privateKeyBase64 = Conversions.encodeBase64(
        signingPrivateKey.toBytes()
      );

      const signature = await signWith(
        signingPrivateKey.publicKey.toHex(),
        privateKeyBase64,
        Transaction.fromDeploy(deploy)
      );

      deploy = Deploy.setSignature(
        deploy,
        signature,
        signingPrivateKey.publicKey
      );

      return deploy.approvals[0].signer;
    };

    expect(await getSignedDeployApproval()).toEqual(
      signingPrivateKey.publicKey
    );
  });

  it('rejects a mismatched key pair with KeyPairMismatchError', async () => {
    const signingPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const unrelatedPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const tx = Transaction.fromDeploy(buildTransferDeploy(signingPrivateKey));
    const privateKeyBase64 = Conversions.encodeBase64(
      signingPrivateKey.toBytes()
    );

    await expect(
      signWith(unrelatedPrivateKey.publicKey.toHex(), privateKeyBase64, tx)
    ).rejects.toThrow(KeyPairMismatchError);
  });
});
