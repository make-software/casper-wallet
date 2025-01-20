import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import { createMessageBytesWithHeaders, signMessage } from './sign-message';

const getMessageSignature = (message: string, privateKey: PrivateKey) => {
  const publicKeyHex = privateKey.publicKey.toHex();

  const privateKeyBase64 = Conversions.encodeBase64(privateKey.toBytes());

  return signMessage(message, publicKeyHex, privateKeyBase64);
};

describe('sign-message', () => {
  const message = 'Correct';
  const wrongMessage = 'asdfsad';

  it('should pass verification of message for Ed25519 keyPair', () => {
    const privateKey1 = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature1 = getMessageSignature(message, privateKey1);

    expect(
      privateKey1.publicKey.verifySignature(
        createMessageBytesWithHeaders(message),
        signature1
      )
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Ed25519 keyPair', () => {
    const privateKey2 = PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature2 = getMessageSignature(message, privateKey2);

    expect(
      privateKey2.publicKey.verifySignature(
        createMessageBytesWithHeaders(wrongMessage),
        signature2
      )
    ).toThrow();
  });

  it('should pass verification of message for Secp256K1 keyPair', () => {
    const privateKey3 = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature3 = getMessageSignature(message, privateKey3);

    expect(
      privateKey3.publicKey.verifySignature(
        createMessageBytesWithHeaders(message),
        signature3
      )
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Secp256K1 keyPair', () => {
    const privateKey4 = PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature4 = getMessageSignature(message, privateKey4);

    expect(
      privateKey4.publicKey.verifySignature(
        createMessageBytesWithHeaders(wrongMessage),
        signature4
      )
    ).toThrow();
  });
});
