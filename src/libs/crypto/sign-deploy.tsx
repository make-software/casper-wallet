import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';

import { getPrivateKeyHexFromSecretKey } from '@src/utils';

export const signDeployForProviderResponse = (
  deployHash: Uint8Array,
  publicKeyHex: string,
  privateKeyBase64: string
) => {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const privateKey = PrivateKey.fromHex(
    getPrivateKeyHexFromSecretKey(Conversions.base64to16(privateKeyBase64)),
    publicKey.cryptoAlg
  );

  // signature is a signed deploy hash
  const signature = privateKey.sign(deployHash);

  // ERROR HANDLING
  if (signature == null) {
    throw Error('Signature is empty.');
  }

  return signature;
};
