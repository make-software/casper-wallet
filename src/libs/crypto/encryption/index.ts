import { KeyAlgorithm, PublicKey } from 'casper-js-sdk';

import { ed25519 } from './ed25519';
import { bytesToHex, hexToBytes } from './hex';
import { secp256k1 } from './secp256k1';

export * from './hex';

export { ed25519, secp256k1 };

export async function encrypt(
  publicKeyHex: string,
  message: string
): Promise<Uint8Array> {
  const len = hexToBytes(publicKeyHex).length;
  if (len === 32) return ed25519.encrypt(publicKeyHex, message);
  if (len === 33) return secp256k1.encrypt(publicKeyHex, message);
  throw new Error('Unknown public key type');
}

export async function encryptAsHex(
  publicKeyHex: string,
  message: string
): Promise<string> {
  return bytesToHex(await encrypt(publicKeyHex, message));
}

export async function encryptAsHexWithCasperPublicKey(
  publicKeyHex: string,
  message: string
): Promise<string> {
  return encryptAsHex(publicKeyHex.slice(2), message);
}

export async function decryptEncryptedBase64PrivateKey(
  encryptedHex: string,
  publicKeyHex: string,
  privateKeyBase64: string
): Promise<string> {
  const pk = PublicKey.fromHex(publicKeyHex);

  if (pk.cryptoAlg === KeyAlgorithm.ED25519) {
    return ed25519.decryptWithBase64PrivateKey(
      privateKeyBase64,
      hexToBytes(encryptedHex)
    );
  } else if (pk.cryptoAlg === KeyAlgorithm.SECP256K1) {
    return secp256k1.decryptWithBase64PrivateKey(
      privateKeyBase64,
      hexToBytes(encryptedHex)
    );
  }

  throw new Error('Unknown public key type');
}
