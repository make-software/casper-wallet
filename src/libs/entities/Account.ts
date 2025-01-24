import { PublicKey } from 'casper-js-sdk';

// PublicKey casper nomenclature:
// - public key = base16 hex => algo prefix + public key hex
// - account hash - internal representation of a public key with a fixed length

// base16 hex: '01deba7173738a7f55de3ad9dc27e081df41ff285f25887ec424a8a65b43d0cf77'
// base64 "2qdt4zi/b/uagi2L9Y+db0I0Jt62CTpR/Td9HhiRAu0="

// ED = 01 public keys should be 66 chars long (with the prefix)
// SEC = 02 public keys should be 68 chars long (with the prefix)

export const getRawPublicKey = (publicKeyHex: string): PublicKey =>
  PublicKey.fromHex(publicKeyHex);

export const getAccountHashFromPublicKey = (
  publicKey: string | undefined
): string => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return getRawPublicKey(publicKey).accountHash().toHex();
};
