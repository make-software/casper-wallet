import { secp256k1 as noble_secp256k1 } from '@noble/curves/secp256k1';

import { hexToBytes } from './hex';

function getCrypto(): Crypto {
  const c = globalThis.crypto;
  if (!c || !c.subtle) {
    throw new Error('WebCrypto is not available');
  }
  return c;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function leftPad32(x: Uint8Array): Uint8Array {
  if (x.length === 32) return x;
  if (x.length < 32) {
    const out = new Uint8Array(32);
    out.set(x, 32 - x.length);
    return out;
  }
  // length > 32: allow only leading zero padding
  const extra = x.length - 32;
  for (let i = 0; i < extra; i++) {
    if (x[i] !== 0) {
      throw new Error(
        `Unexpected secp256k1 scalar length: ${x.length} (non-zero prefix)`
      );
    }
  }
  return x.slice(x.length - 32);
}

// ECIES
const ALG = { SECP256K1: 0x01 };

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function packECIES(
  ephPub: Uint8Array,
  salt: Uint8Array,
  iv: Uint8Array,
  tag: Uint8Array,
  ct: Uint8Array
): Uint8Array {
  const hdr = new Uint8Array([
    ALG.SECP256K1,
    ephPub.length >> 8,
    ephPub.length & 0xff
  ]);
  return concat(hdr, ephPub, salt, iv, tag, ct);
}

function unpackECIES(buf: Uint8Array) {
  const ephLen = (buf[1] << 8) | buf[2];
  let o = 3;
  return {
    ephPub: buf.slice(o, (o += ephLen)),
    salt: buf.slice(o, (o += 16)),
    iv: buf.slice(o, (o += 12)),
    tag: buf.slice(o, (o += 16)),
    ct: buf.slice(o)
  };
}

// HKDF
const HKDF_INFO = enc.encode('ecies-secp256k1-v1');

async function hkdfAesKey(
  shared: Uint8Array,
  salt: Uint8Array
): Promise<CryptoKey> {
  const crypto = getCrypto();
  const ikm = await crypto.subtle.importKey('raw', shared, 'HKDF', false, [
    'deriveBits'
  ]);

  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: HKDF_INFO },
    ikm,
    256
  );

  return crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt'
  ]);
}

// Encryption
function randomBytes(len: number): Uint8Array {
  const crypto = getCrypto();
  const out = new Uint8Array(len);
  crypto.getRandomValues(out);
  return out;
}

export async function encrypt(
  publicKeyHex: string,
  message: string
): Promise<Uint8Array> {
  const pub = hexToBytes(publicKeyHex);
  if (pub.length !== 33) {
    throw new Error('Expected compressed secp256k1 key');
  }

  const ephSk = noble_secp256k1.utils.randomPrivateKey();
  const ephPub = noble_secp256k1.getPublicKey(ephSk, true);
  const shared = noble_secp256k1.getSharedSecret(ephSk, pub, true);

  const salt = randomBytes(16);
  const iv = randomBytes(12);

  const key = await hkdfAesKey(shared, salt);

  const out = new Uint8Array(
    await getCrypto().subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(message)
    )
  );

  return packECIES(
    ephPub,
    salt,
    iv,
    out.slice(-16), // tag
    out.slice(0, -16) // ciphertext
  );
}

export async function decryptWithScalar(
  scalar32: Uint8Array,
  encryptedBytes: Uint8Array
): Promise<string> {
  const { ephPub, salt, iv, tag, ct } = unpackECIES(encryptedBytes);
  const shared = noble_secp256k1.getSharedSecret(scalar32, ephPub, true);

  const key = await hkdfAesKey(shared, salt);

  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    concat(ct, tag)
  );

  return dec.decode(new Uint8Array(pt));
}

export async function decryptWithBase64PrivateKey(
  privateKeyBase64: string,
  encryptedBytes: Uint8Array
): Promise<string> {
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c =>
    c.charCodeAt(0)
  );
  const scalar32 = leftPad32(privateKeyBytes);
  return decryptWithScalar(scalar32, encryptedBytes);
}

export const secp256k1 = {
  encrypt,
  decryptWithBase64PrivateKey
};
