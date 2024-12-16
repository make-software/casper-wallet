import { Conversions, PrivateKey, PublicKey } from 'casper-js-sdk';

export interface AsymmetricKeys {
  publicKey: PublicKey;
  secretKey: PrivateKey;
}

export async function createAsymmetricKeys(
  publicKeyHex: string,
  secretKeyBase64: string
): Promise<AsymmetricKeys> {
  const publicKey = PublicKey.fromHex(publicKeyHex);
  const privateKey = await PrivateKey.fromHex(
    Conversions.base64to16(secretKeyBase64),
    publicKey.cryptoAlg
  );

  return {
    publicKey: publicKey,
    secretKey: privateKey
  };
}
