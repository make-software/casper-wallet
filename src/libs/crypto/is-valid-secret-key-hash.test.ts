import { isValidSecretKeyHash } from './is-valid-secret-key-hash';

/**
 * The rule behind the Torus secret-key import field. The upper bound carries the weight:
 * `getPrivateKeyHexFromSecretKey` truncates with `substring(0, 64)`, so a rule accepting anything
 * longer would silently derive from the first 32 bytes of the paste.
 */

const VALID_SECRET_KEY =
  '0f7e7bb1cfd213fd70b4fb60079c15f4588bfe2c6451d22964056e0d10cbd607';

/** The SECP256K1 group order `n`. Valid scalars are `0 < key < n`. */
const CURVE_ORDER =
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141';
const CURVE_ORDER_MINUS_ONE =
  'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140';

describe('isValidSecretKeyHash', () => {
  it.each([
    ['a valid SECP256K1 secret key', VALID_SECRET_KEY],
    ['the same key in upper case', VALID_SECRET_KEY.toUpperCase()],
    ['the largest valid scalar, n - 1', CURVE_ORDER_MINUS_ONE]
  ])('accepts %s', (_label, secretKey) => {
    expect(isValidSecretKeyHash(secretKey)).toBe(true);
  });

  it.each([
    ['the empty string', ''],
    ['one character short', VALID_SECRET_KEY.slice(0, -1)],
    ['one character long', `${VALID_SECRET_KEY}a`],
    ['a non-hex character', `${VALID_SECRET_KEY.slice(0, -1)}z`],
    // The form the truncation exists for: this field takes a raw 32-byte key.
    ['a secret key with the public key appended', VALID_SECRET_KEY.repeat(2)]
  ])('rejects %s', (_label, secretKey) => {
    expect(isValidSecretKeyHash(secretKey)).toBe(false);
  });

  // Well-formed hex that is not a usable scalar: only the SDK's range check rejects these.
  it.each([
    ['zero', '00'.repeat(32)],
    ['the curve order n itself', CURVE_ORDER],
    ['a value above n', 'ff'.repeat(32)]
  ])('rejects %s, which is 64 valid hex characters', (_label, secretKey) => {
    expect(isValidSecretKeyHash(secretKey)).toBe(false);
  });

  // `.trim()` applies to the shape check only, while the untrimmed string is what
  // gets truncated. Pinned both ways so making it consistent is a deliberate change.
  it('accepts a valid key with a trailing space', () => {
    expect(isValidSecretKeyHash(`${VALID_SECRET_KEY} `)).toBe(true);
  });

  it('rejects the same key with a leading space', () => {
    expect(isValidSecretKeyHash(` ${VALID_SECRET_KEY}`)).toBe(false);
  });
});
