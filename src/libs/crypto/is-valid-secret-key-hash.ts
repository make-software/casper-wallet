import { KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import { getPrivateKeyHexFromSecretKey } from '@src/utils';

/** A raw 32-byte secret key as base16 hex. */
const secretKeyHashRegExp = new RegExp('^([0-9A-Fa-f]){64}$');

/*
 * This function checks if the provided secretKey is a valid hash key.
 * Firstly, it checks if the secretKey is not an empty string.
 * Then, it tests the secretKey against the defined regular expression using test() method.
 * If the secretKey passes these checks, it attempts to parse and decode it as a 'raw' type private key.
 * If no exceptions occur during parsing and decoding, the function returns true indicating the secretKey is valid.
 * If the secretKey fails any of these checks or an exception is caught during parsing/decoding,
 * false is returned indicating the secretKey is invalid.
 *
 * It lives here rather than in `@src/utils` because deciding whether the bytes are a usable
 * SECP256K1 scalar is the SDK's job, and `@src/utils` is on the startup path of every page entry —
 * a value import of `casper-js-sdk` there links the whole prebuilt UMD bundle eagerly.
 */
export const isValidSecretKeyHash = (secretKey: string) => {
  if (!secretKey) {
    return false;
  }

  if (!secretKeyHashRegExp.test(secretKey.trim())) {
    return false;
  }

  try {
    PrivateKey.fromHex(
      getPrivateKeyHexFromSecretKey(secretKey),
      KeyAlgorithm.SECP256K1
    );

    return true;
  } catch (error) {
    return false;
  }
};
