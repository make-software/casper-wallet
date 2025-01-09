import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';

export interface AsymmetricKeys {
  publicKey: PublicKey;
  secretKey: PrivateKey | null;
}

export function createAsymmetricKeys(
  publicKeyHex: string,
  secretKeyBase64: string
): AsymmetricKeys {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const privateKey = secretKeyBase64.length
    ? PrivateKey.fromHex(
        Conversions.base64to16(secretKeyBase64),
        publicKey.cryptoAlg
      )
    : null;

  return {
    publicKey: publicKey,
    secretKey: privateKey
  };
}
