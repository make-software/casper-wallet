import { Keys } from 'casper-js-sdk';
import { createMessageBytesWithHeaders, signMessage } from './sign-message';

const getMessageSignature = (
  message: string,
  keyPair: Keys.Ed25519 | Keys.Secp256K1
) => {
  const publicKeyHex = keyPair.publicKey.toHex();
  const privateKeyBase64 = Buffer.from(keyPair.privateKey).toString('base64');
  return signMessage(message, publicKeyHex, privateKeyBase64);
};

describe('sign-message', () => {
  const message = 'Correct';
  const wrongMessage = 'asdfsad';

  it('should get correct signature for Ed25519 keyPair', () => {
    const keyPair = Keys.Ed25519.new();
    const signature = getMessageSignature(message, keyPair);
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(message))
    ).toBeTruthy();
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(wrongMessage))
    ).toBeFalsy();
  });

  it('should get correct signature for Secp256K1 keyPair', () => {
    const keyPair = Keys.Secp256K1.new();
    const signature = getMessageSignature(message, keyPair);
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(message))
    ).toBeTruthy();
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(wrongMessage))
    ).toBeFalsy();
  });
});
