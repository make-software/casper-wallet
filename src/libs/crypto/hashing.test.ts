import {
  deriveEncryptionKey,
  encodePassword,
  verifyPasswordAgainstHash
} from './hashing';
import {
  FIXED_ENCRYPTION_KEY_HASH,
  FIXED_PASSWORD_HASH,
  FIXED_PASSWORD_TEXT,
  FIXED_ENCRYPTION_SALT,
  FIXED_PASSWORD_SALT
} from './__fixtures';

describe('crypto.hashing', () => {
  it('should verify fixtures of hashed password matches the text password ', async () => {
    const result = await verifyPasswordAgainstHash(
      FIXED_PASSWORD_HASH,
      FIXED_PASSWORD_SALT,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeTruthy();
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
