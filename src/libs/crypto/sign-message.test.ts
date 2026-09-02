import { concatBytes } from '@noble/ciphers/utils.js';
import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';
import {
  KeyPairMismatchError,
  createCasperMessageBytes,
  createPrivateKeySigner
} from 'casper-wallet-core';

const getMessageSignature = async (message: string, privateKey: PrivateKey) => {
  const publicKeyHex = privateKey.publicKey.toHex();
  const secretKeyBase64 = Conversions.encodeBase64(privateKey.toBytes());

  const signer = createPrivateKeySigner({ publicKeyHex, secretKeyBase64 });

  return signer.signMessage(message);
};

describe('sign-message', () => {
  const message = 'Correct';
  const wrongMessage = 'asdfsad';

  it('should pass verification of message for Ed25519 keyPair', async () => {
    const privateKey1 = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature1 = await getMessageSignature(message, privateKey1);
    const algBytes = Uint8Array.of(privateKey1.publicKey.cryptoAlg);

    expect(
      privateKey1.publicKey.verifySignature(
        createCasperMessageBytes(message),
        concatBytes(algBytes, signature1)
      )
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Ed25519 keyPair', async () => {
    const privateKey2 = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature2 = await getMessageSignature(message, privateKey2);
    const algBytes = Uint8Array.of(privateKey2.publicKey.cryptoAlg);

    expect(() =>
      privateKey2.publicKey.verifySignature(
        createCasperMessageBytes(wrongMessage),
        concatBytes(algBytes, signature2)
      )
    ).toThrow();
  });

  it('should pass verification of message for Secp256K1 keyPair', async () => {
    const privateKey3 = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature3 = await getMessageSignature(message, privateKey3);
    const algBytes = Uint8Array.of(privateKey3.publicKey.cryptoAlg);

    expect(
      privateKey3.publicKey.verifySignature(
        createCasperMessageBytes(message),
        concatBytes(algBytes, signature3)
      )
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Secp256K1 keyPair', async () => {
    const privateKey4 = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature4 = await getMessageSignature(message, privateKey4);
    const algBytes = Uint8Array.of(privateKey4.publicKey.cryptoAlg);

    expect(() =>
      privateKey4.publicKey.verifySignature(
        createCasperMessageBytes(wrongMessage),
        concatBytes(algBytes, signature4)
      )
    ).toThrow();
  });

  it('rejects a mismatched key pair with KeyPairMismatchError', async () => {
    const signingPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const unrelatedPrivateKey = PrivateKey.generate(KeyAlgorithm.ED25519);
    const secretKeyBase64 = Conversions.encodeBase64(
      signingPrivateKey.toBytes()
    );

    const signer = createPrivateKeySigner({
      publicKeyHex: unrelatedPrivateKey.publicKey.toHex(),
      secretKeyBase64
    });

    await expect(signer.signMessage(message)).rejects.toThrow(
      KeyPairMismatchError
    );
  });
});
