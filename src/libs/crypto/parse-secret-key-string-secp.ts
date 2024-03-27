import { Keys, decodeBase16 } from 'casper-js-sdk';

import { privateKeyBytesToBase64 } from '@libs/crypto/utils';

export const parseSecretKeyStringSecp = (secretKeyHex: string) => {
  let keyPair: Keys.AsymmetricKey;

  try {
    const secretKey = decodeBase16(secretKeyHex);
    const privateKeyBuffer = Keys.Secp256K1.parsePrivateKey(secretKey, 'raw');
    const publicKey = Keys.Secp256K1.privateToPublicKey(privateKeyBuffer);

    keyPair = Keys.Secp256K1.parseKeyPair(publicKey, secretKey, 'raw');
  } catch (error) {
    console.error(error);
    throw Error('Invalid secret key');
  }

  return {
    secretKeyBase64: privateKeyBytesToBase64(keyPair.privateKey),
    publicKeyHex: keyPair.publicKey.toHex(false)
  };
};
