import { Conversions, KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import { getPrivateKeyHexFromSecretKey } from '@src/utils';

import { AsymmetricKeys } from '@libs/crypto/create-asymmetric-key';

export const parseSecretKeyStringSecp = (secretKeyHex: string) => {
  let keyPair: AsymmetricKeys;

  try {
    const privateKey = PrivateKey.fromHex(
      getPrivateKeyHexFromSecretKey(secretKeyHex),
      KeyAlgorithm.SECP256K1
    );
    const publicKey = privateKey.publicKey;

    keyPair = {
      publicKey,
      secretKey: privateKey
    };
  } catch (error) {
    throw Error('Invalid secret key');
  }

  if (!keyPair.secretKey) {
    throw Error('Invalid secret key');
  }

  return {
    secretKeyBase64: Conversions.encodeBase64(keyPair.secretKey.toBytes()),
    publicKeyHex: keyPair.publicKey.toHex(false)
  };
};
