import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';

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

export const signMessage = async (
  message: string,
  publicKeyHex: string,
  privateKeyBase64: string
) => {
  const publicKey = PublicKey.fromHex(publicKeyHex);

  const privateKey = await PrivateKey.fromHex(
    Conversions.base64to16(privateKeyBase64),
    publicKey.cryptoAlg
  );
  `§`;
  const messageHash = Uint8Array.from(
    Buffer.from(createMessageBytesWithHeaders(message))
  );

  // signature is a signed deploy hash
  const signature = await privateKey.sign(messageHash);

  // ERROR HANDLING
  if (signature == null) {
    throw Error('Signature is empty.');
  }

  return signature;
};
