import { Keys } from 'casper-js-sdk';
import { createMessageBytesWithHeaders, signMessage } from './sign-message';

const getMessageSignature = (
  message: string,
  keyPair: Keys.Ed25519 | Keys.Secp256K1
) => {
  const publicKeyHex = keyPair.publicKey.toHex(false);
  const privateKeyBase64 = Buffer.from(keyPair.privateKey).toString('base64');
  return signMessage(message, publicKeyHex, privateKeyBase64);
};

describe('sign-message', () => {
  const message = 'Correct';
  const wrongMessage = 'asdfsad';

  let keyPair: Keys.Ed25519, signature: Uint8Array;

  beforeEach(() => {
    keyPair = Keys.Ed25519.new();
    signature = getMessageSignature(message, keyPair);
  });

  it('should pass verification of message for Ed25519 keyPair', () => {
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(message))
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Ed25519 keyPair', () => {
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(wrongMessage))
    ).toBeFalsy();
  });

  it('should pass verification of message for Secp256K1 keyPair', () => {
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(message))
    ).toBeTruthy();
  });

  it('should fail verification of wrong message for Secp256K1 keyPair', () => {
    expect(
      keyPair.verify(signature, createMessageBytesWithHeaders(wrongMessage))
    ).toBeFalsy();
  });
});
