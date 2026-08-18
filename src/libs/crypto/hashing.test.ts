import {
  FIXED_ENCRYPTION_KEY_HASH,
  FIXED_ENCRYPTION_SALT,
  FIXED_PASSWORD_HASH,
  FIXED_PASSWORD_SALT,
  FIXED_PASSWORD_TEXT
} from './__fixtures';
import {
  constantTimeEqualHex,
  deriveEncryptionKey,
  encodePassword,
  verifyPasswordAgainstHash
} from './hashing';

describe('crypto.hashing', () => {
  it('should verify fixtures of hashed password matches the text password ', async () => {
    const result = await verifyPasswordAgainstHash(
      FIXED_PASSWORD_HASH,
      FIXED_PASSWORD_SALT,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeTruthy();
  });

  it('routes through the constant-time comparison, not ===: an upper-case hash still verifies', async () => {
    const result = await verifyPasswordAgainstHash(
      FIXED_PASSWORD_HASH.toUpperCase(),
      FIXED_PASSWORD_SALT,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBe(true);
  });

  it('should match password text that created it', async () => {
    const passwordHash = await encodePassword(
      FIXED_PASSWORD_TEXT,
      FIXED_PASSWORD_SALT
    );
    const result = await verifyPasswordAgainstHash(
      passwordHash,
      FIXED_PASSWORD_SALT,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeTruthy();
  });

  it('should fail matching any other text', async () => {
    const passwordHash = await encodePassword('some text', FIXED_PASSWORD_SALT);
    const result = await verifyPasswordAgainstHash(
      passwordHash,
      FIXED_PASSWORD_SALT,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeFalsy();
  });

  it('should generate random hash from the same text with different salt each time', async () => {
    const hash1 = await encodePassword(
      FIXED_PASSWORD_TEXT,
      FIXED_PASSWORD_SALT
    );
    const hash2 = await encodePassword(
      FIXED_PASSWORD_TEXT,
      'asdfasdfa32fas32fgasd2rfa'
    );
    expect(hash1).not.toBe(hash2);
  });

  it('should derive expected encryption key from fixed password + salt', async () => {
    const key = await deriveEncryptionKey(
      FIXED_PASSWORD_TEXT,
      FIXED_ENCRYPTION_SALT
    );
    expect(Buffer.from(key).toString('hex')).toBe(FIXED_ENCRYPTION_KEY_HASH);
  });
});

describe('constantTimeEqualHex', () => {
  it('accepts identical hex', () => {
    expect(constantTimeEqualHex(FIXED_PASSWORD_HASH, FIXED_PASSWORD_HASH)).toBe(
      true
    );
  });

  it('rejects a single flipped bit', () => {
    const flipped =
      FIXED_PASSWORD_HASH.slice(0, -1) +
      (FIXED_PASSWORD_HASH.endsWith('0') ? '1' : '0');

    expect(constantTimeEqualHex(FIXED_PASSWORD_HASH, flipped)).toBe(false);
  });

  it('rejects different lengths without throwing', () => {
    expect(constantTimeEqualHex(FIXED_PASSWORD_HASH, 'ab')).toBe(false);
    expect(constantTimeEqualHex('', FIXED_PASSWORD_HASH)).toBe(false);
    expect(constantTimeEqualHex('', '')).toBe(true);
  });

  it('does not throw on non-hex garbage input', () => {
    expect(() => constantTimeEqualHex('zzzz', 'zzzz')).not.toThrow();
    expect(constantTimeEqualHex('zzzz', 'zzzz')).toBe(false);
  });

  it('rejects inputs that truncate to the same bytes but are not equal hex', () => {
    expect(constantTimeEqualHex('abzz', 'abyy')).toBe(false);
  });

  it('rejects odd-length inputs that decode short', () => {
    expect(constantTimeEqualHex('abc', 'abd')).toBe(false);
  });
});
