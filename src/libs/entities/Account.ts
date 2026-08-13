import { getAccountHashFromPublicKey as deriveAccountHash } from 'casper-wallet-core/src/utils/casperSdk/accountHash';

/**
 * {@link deriveAccountHash}, with the extra guard our call sites rely on: several of them read the
 * public key off an account that may not be loaded yet and expect a throw rather than a hash of
 * `undefined`.
 *
 * The derivation itself lives in `casper-wallet-core` and is byte-for-byte equivalent to
 * `PublicKey.fromHex(publicKey).accountHash().toHex()` without linking `casper-js-sdk` — this
 * function runs synchronously while the home screen renders, so it cannot be deferred.
 */
export const getAccountHashFromPublicKey = (
  publicKey: string | undefined
): string => {
  if (!publicKey) {
    throw Error('Missing public key');
  }

  return deriveAccountHash(publicKey);
};
