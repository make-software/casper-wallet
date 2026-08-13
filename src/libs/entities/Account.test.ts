import { getAccountHashFromPublicKey } from './Account';

/**
 * WALLET-1381 moved this derivation onto `casper-wallet-core`, which
 * reimplements `PublicKey.fromHex(pk).accountHash()` without linking the SDK.
 * Core's own parity test lives in `node_modules`, jest never collects it, and
 * the dependency is pinned by a mutable git SHA — so a core-side change to the
 * preimage would land on a bump with ci-check green, and every account hash the
 * wallet shows and queries would move.
 *
 * The vectors are literals, generated once from `casper-js-sdk@5.1.0`.
 * Re-deriving them with the SDK at test time would only prove the two agree.
 */
const VECTORS = [
  {
    algorithm: 'ed25519',
    publicKey:
      '0125c4ffb9cc43f8211f9f5917f1eb941ccd0a8aec086154b046d4dbd290c476c5',
    accountHash:
      '2fbfe6f3127e7a55a57c37fb1c050aaaf7d32b8b783213e913e575b41490ee35'
  },
  {
    algorithm: 'ed25519',
    publicKey:
      '01f1299fa179b66e2e84253dab93f3d0dc639d35216045c3717c20df490411c994',
    accountHash:
      'f028668bd26604c2eaf7a53cce5b74bf4a80c23fbe522fcd4589ea70382a31ec'
  },
  {
    algorithm: 'secp256k1',
    publicKey:
      '0202d137fdf848673f12b8b50c8204cd5dee9bd39083deb22178e549cac3d882d429',
    accountHash:
      'e0f01a96798195f48500b47c90b4405625dd4d1f47ad101e14868802178782b6'
  },
  {
    algorithm: 'secp256k1',
    publicKey:
      '02029cdd2c483a61dfd17b3b6a8b648decc9fcc794a81f35ec8445af0db7586287b6',
    accountHash:
      'b59912199fac1afaa9b3c620adb6723e3832024373737f289857f524d83d875e'
  }
] as const;

describe('getAccountHashFromPublicKey', () => {
  it.each(VECTORS)(
    'derives the $algorithm hash for $publicKey',
    ({ publicKey, accountHash }) => {
      expect(getAccountHashFromPublicKey(publicKey)).toBe(accountHash);
    }
  );

  it('is case-insensitive about the input', () => {
    const { publicKey, accountHash } = VECTORS[0];

    expect(getAccountHashFromPublicKey(publicKey.toUpperCase())).toBe(
      accountHash
    );
  });

  // Four call sites read the key off an account that may not be loaded yet and
  // rely on a throw rather than a hash of the string "undefined".
  it.each([undefined, ''])('throws for %p rather than hashing it', value => {
    expect(() => getAccountHashFromPublicKey(value)).toThrow(
      'Missing public key'
    );
  });
});
