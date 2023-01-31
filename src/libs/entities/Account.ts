import {
  CLPublicKey,
  decodeBase64,
  encodeBase16,
  encodeBase64
} from 'casper-js-sdk';

// PublicKey casper nomenclature:
// - public key = base16 hex => algo prefix + public key hex
// - account hash - internal representation of a public key with a fixed length

// base16 hex: '01deba7173738a7f55de3ad9dc27e081df41ff285f25887ec424a8a65b43d0cf77'
// base64 "2qdt4zi/b/uagi2L9Y+db0I0Jt62CTpR/Td9HhiRAu0="

// ED = 01 public keys should be 66 chars long (with the prefix)
// SEC = 02 public keys should be 68 chars long (with the prefix)

type Input = { base64: string } | { publicKeyHex: string };

// copied from casper-explorer
export const AccountModel = (input: Input) => {
  const getRawPublicKey = () => {
    let value: CLPublicKey;

    if ('publicKeyHex' in input) {
      value = CLPublicKey.fromHex(input.publicKeyHex);
    } else if ('base64' in input) {
      // TODO: base64 signer account will always use fromEd25519 because there is no prefix available
      const bytes = decodeBase64(input.base64);
      value = CLPublicKey.fromEd25519(bytes);
    } else {
      throw Error('missing account key');
    }

    return value;
  };

  const getPublicKey = () => {
    // toAccountHex => sig key prefix + base16 (hex) hash
    return getRawPublicKey().toHex();
  };

  const getBase16AccountHash = () => {
    // toAccountHash => raw hash
    return encodeBase16(getRawPublicKey().toAccountHash());
  };

  const getBase64AccountHash = () => {
    // toAccountHash => raw hash
    return encodeBase64(getRawPublicKey().toAccountHash());
  };

  return {
    getPublicKey: getPublicKey,
    getAccountHash: getBase16AccountHash,
    getBase64AccountHash: getBase64AccountHash
  };
};

export const getAccountHashFromPublicKey = (publicKey = ''): string => {
  if (publicKey === '') return '';

  return AccountModel({
    publicKeyHex: publicKey
  }).getAccountHash();
};
