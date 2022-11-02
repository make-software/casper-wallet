import { CLPublicKey, CLPublicKeyTag, decodeBase64, Keys } from 'casper-js-sdk';

export function createAsymmetricKey(
  publicKey: string,
  secretKey: string
): Keys.AsymmetricKey {
  const clPublicKey = CLPublicKey.fromHex(publicKey);
  const decodedSecretKey = decodeBase64(secretKey);

  switch (clPublicKey.tag) {
    case CLPublicKeyTag.ED25519:
      return new Keys.Ed25519({
        publicKey: clPublicKey.value(),
        secretKey: decodedSecretKey
      });

    case CLPublicKeyTag.SECP256K1:
      return new Keys.Secp256K1(clPublicKey.value(), decodedSecretKey);

    default:
      throw Error('Unknown Signature type.');
  }
}
