import { KeyAlgorithm, PrivateKey } from 'casper-js-sdk';

import { getPrivateKeyHexFromSecretKey } from '@src/utils';

const secretKeyHashRegExp = new RegExp('^([0-9A-Fa-f]){64}$');

// Lives here rather than in `@src/utils`: that module is on every page's startup
// path, and a value import of `casper-js-sdk` there links the whole UMD bundle.
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
