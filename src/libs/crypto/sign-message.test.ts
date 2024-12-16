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

  it('should pass verification of message for Ed25519 keyPair', async () => {
    const privateKey1 = await PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature1 = await getMessageSignature(message, privateKey1);

    await expect(
      privateKey1.publicKey.verifySignature(
        createMessageBytesWithHeaders(message),
        signature1
      )
    ).resolves.toBeTruthy();
  });

  it('should fail verification of wrong message for Ed25519 keyPair', async () => {
    const privateKey2 = await PrivateKey.generate(KeyAlgorithm.ED25519);
    const signature2 = await getMessageSignature(message, privateKey2);

    await expect(
      privateKey2.publicKey.verifySignature(
        createMessageBytesWithHeaders(wrongMessage),
        signature2
      )
    ).rejects.toThrow();
  });

  it('should pass verification of message for Secp256K1 keyPair', async () => {
    const privateKey3 = await PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature3 = await getMessageSignature(message, privateKey3);

    await expect(
      privateKey3.publicKey.verifySignature(
        createMessageBytesWithHeaders(message),
        signature3
      )
    ).resolves.toBeTruthy();
  });

  it('should fail verification of wrong message for Secp256K1 keyPair', async () => {
    const privateKey4 = await PrivateKey.generate(KeyAlgorithm.SECP256K1);
    const signature4 = await getMessageSignature(message, privateKey4);

    await expect(
      privateKey4.publicKey.verifySignature(
        createMessageBytesWithHeaders(wrongMessage),
        signature4
      )
    ).rejects.toThrow();
  });
});
