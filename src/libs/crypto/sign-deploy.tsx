import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';

export const signDeploy = async (
  deployHash: Uint8Array,
  publicKeyHex: string,
  privateKeyBase64: string
) => {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const privateKey = await PrivateKey.fromHex(
    Conversions.base64to16(privateKeyBase64),
    publicKey.cryptoAlg
  );

  // signature is a signed deploy hash
  const signature = await privateKey.sign(deployHash);

  // ERROR HANDLING
  if (signature == null) {
    throw Error('Signature is empty.');
  }

  return signature;
};
