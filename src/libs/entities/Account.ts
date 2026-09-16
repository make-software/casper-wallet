import { getAccountHashFromPublicKey as deriveAccountHash } from 'casper-wallet-core/src/utils/casperSdk/accountHash';

/**
 * {@link deriveAccountHash}, with the extra guard our call sites rely on: several read the public
 * key off an account that may not be loaded yet and expect a throw rather than a hash of
 * `undefined`. Core derives it without linking `casper-js-sdk`, which this render path could not
 * afford.
 */
export const getAccountHashFromPublicKey = (
  publicKey: string | undefined
): string => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return deriveAccountHash(publicKey);
};
