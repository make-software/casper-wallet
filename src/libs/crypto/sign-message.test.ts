import { concatBytes } from '@noble/ciphers/utils';
import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import {
  createMessageBytesWithHeaders,
  signMessageForProviderResponse
} from './sign-message';

const getMessageSignature = (message: string, privateKey: PrivateKey) => {
  const publicKeyHex = privateKey.publicKey.toHex();

  const privateKeyBase64 = Conversions.encodeBase64(privateKey.toBytes());

  return signMessageForProviderResponse(
    message,
    publicKeyHex,
    privateKeyBase64
  );
};

describe('sign-message', () => {
  const message = 'Correct';
  const wrongMessage = 'asdfsad';

  it('should pass verification of message for Ed25519 keyPair', () => {
    const privateKey1 = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature1 = getMessageSignature(message, privateKey1);
    const algBytes = Uint8Array.of(privateKey1.publicKey.cryptoAlg);

    expect(
      privateKey1.publicKey.verifySignature(
        createMessageBytesWithHeaders(message),
        concatBytes(algBytes, signature1)
      )
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Ed25519 keyPair', () => {
    const privateKey2 = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature2 = getMessageSignature(message, privateKey2);
    const algBytes = Uint8Array.of(privateKey2.publicKey.cryptoAlg);

    expect(() =>
      privateKey2.publicKey.verifySignature(
        createMessageBytesWithHeaders(wrongMessage),
        concatBytes(algBytes, signature2)
      )
    ).toThrow();
  });

  it('should pass verification of message for Secp256K1 keyPair', () => {
    const privateKey3 = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature3 = getMessageSignature(message, privateKey3);
    const algBytes = Uint8Array.of(privateKey3.publicKey.cryptoAlg);

    expect(
      privateKey3.publicKey.verifySignature(
        createMessageBytesWithHeaders(message),
        concatBytes(algBytes, signature3)
      )
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Secp256K1 keyPair', () => {
    const privateKey4 = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature4 = getMessageSignature(message, privateKey4);
    const algBytes = Uint8Array.of(privateKey4.publicKey.cryptoAlg);

    expect(() =>
      privateKey4.publicKey.verifySignature(
        createMessageBytesWithHeaders(wrongMessage),
        concatBytes(algBytes, signature4)
      )
    ).toThrow();
  });
});
