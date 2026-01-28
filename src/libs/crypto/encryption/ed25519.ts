import sodium from 'libsodium-wrappers-sumo';

import { convertBase64ToBytes } from '@libs/crypto/utils';

const dec = new TextDecoder();

export async function encrypt(
  publicKeyHex: string,
  message: string
): Promise<Uint8Array> {
  await sodium.ready;

  const edPub = sodium.from_hex(publicKeyHex) as Uint8Array;
  if (edPub.length !== 32) {
    throw new Error('Ed25519 public key must be 32 bytes');
  }

  const xPub = sodium.crypto_sign_ed25519_pk_to_curve25519(edPub) as Uint8Array;
  return sodium.crypto_box_seal(message, xPub) as Uint8Array;
}

export async function decryptWithSeed(
  seed32: Uint8Array,
  encryptedBytes: Uint8Array
): Promise<string> {
  await sodium.ready;

  if (seed32.length !== 32) {
    throw new Error('Ed25519 seed must be 32 bytes');
  }

  const kp = sodium.crypto_sign_seed_keypair(seed32) as {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  };

  const xSk = sodium.crypto_sign_ed25519_sk_to_curve25519(kp.privateKey);

  const xPk = sodium.crypto_sign_ed25519_pk_to_curve25519(kp.publicKey);

  const pt = sodium.crypto_box_seal_open(encryptedBytes, xPk, xSk);

  if (!pt) throw new Error('Decryption failed');

  return dec.decode(pt);
}

export async function decryptWithBase64PrivateKey(
  privateKeyBase64: string,
  encryptedBytes: Uint8Array
): Promise<string> {
  const raw = convertBase64ToBytes(privateKeyBase64);

  let seed: Uint8Array;
  if (raw.length === 32) {
    seed = raw;
  } else if (raw.length === 64) {
    seed = raw.slice(0, 32);
  } else if (raw.length > 32 && raw.length < 64) {
    seed = raw.slice(raw.length % 32);
  } else {
    throw new Error(`Unexpected Ed25519 private key length: ${raw.length}`);
  }

  if (seed.length !== 32) {
    throw new Error(`Failed to parse Ed25519 seed; got ${seed.length} bytes`);
  }

  return decryptWithSeed(seed, encryptedBytes);
}

export const ed25519 = {
  encrypt,
  decryptWithBase64PrivateKey
};
