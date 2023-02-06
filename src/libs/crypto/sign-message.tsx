import { CLPublicKey, CLPublicKeyTag, decodeBase64, Keys } from 'casper-js-sdk';

export const CASPER_MESSAGE_HEADER = `Casper Message:\n`;

/**
 * Prepends the string with Casper message header and converts to the byte array.
 * @param message The string to be formatted.
 * @returns The bytes of the formatted message
 */
export const createMessageBytesWithHeaders = (message: string): Uint8Array => {
  // Avoiding usage of Text Encoder lib to support legacy nodejs versions.
  const messageWithHeader = `${CASPER_MESSAGE_HEADER}${message}`;
  return Uint8Array.from(Buffer.from(messageWithHeader));
};

export const signMessage = (
  message: string,
  publicKeyHex: string,
  privateKeyBase64: string
) => {
  const clPublicKey = CLPublicKey.fromHex(publicKeyHex);
  const publicKey = clPublicKey.value();
  const secretKey = decodeBase64(privateKeyBase64);
  const messageHash = Uint8Array.from(
    Buffer.from(createMessageBytesWithHeaders(message))
  );

  let keyPair: Keys.AsymmetricKey;
  switch (clPublicKey.tag) {
    case CLPublicKeyTag.ED25519:
      keyPair = new Keys.Ed25519({ publicKey, secretKey });
      break;

    case CLPublicKeyTag.SECP256K1:
      keyPair = new Keys.Secp256K1(publicKey, secretKey);
      break;

    default:
      throw Error('Unknown Signature type.');
  }

  // signature is a signed deploy hash
  const signature = keyPair.sign(messageHash);

  // ERROR HANDLING
  if (signature == null) {
    throw Error('Signature is empty.');
  }

  return signature;
};
