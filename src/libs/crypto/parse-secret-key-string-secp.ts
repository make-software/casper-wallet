import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import { AsymmetricKeys } from '@libs/crypto/create-asymmetric-key';

export const parseSecretKeyStringSecp = async (secretKeyHex: string) => {
  let keyPair: AsymmetricKeys;

  try {
    const privateKey = await PrivateKey.fromHex(
      secretKeyHex,
      KeyAlgorithm.SECP256K1
    );
    const publicKey = privateKey.publicKey;

    keyPair = {
      publicKey,
      secretKey: privateKey
    };
  } catch (error) {
    console.error(error);
    throw Error('Invalid secret key');
  }

  return {
    secretKeyBase64: Conversions.encodeBase64(keyPair.secretKey.toBytes()),
    publicKeyHex: keyPair.publicKey.toHex(false)
  };
};
