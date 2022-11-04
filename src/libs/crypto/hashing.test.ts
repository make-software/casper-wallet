import {
  deriveEncryptionKey,
  encodePassword,
  verifyPasswordAgainstDigest
} from './hashing';
import {
  FIXED_ENCRYPTION_KEY_HEX,
  FIXED_PASSWORD_DIGEST,
  FIXED_PASSWORD_TEXT,
  FIXED_RANDOM_SALT
} from './__fixtures';

describe('crypto.hashing', () => {
  it('should verify fixtures of hashed password matches the text password ', async () => {
    const result = await verifyPasswordAgainstDigest(
      FIXED_PASSWORD_DIGEST,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeTruthy();
  });

  it('should match password text that created it', async () => {
    const passwordDigest = await encodePassword(FIXED_PASSWORD_TEXT);
    const result = await verifyPasswordAgainstDigest(
      passwordDigest,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeTruthy();
  });

  it('should fail matching any other text', async () => {
    const passwordDigest = await encodePassword('some text');
    const result = await verifyPasswordAgainstDigest(
      passwordDigest,
      FIXED_PASSWORD_TEXT
    );
    expect(result).toBeFalsy();
  });

  it('should generate random hash from the same input each time', async () => {
    const digest1 = await encodePassword(FIXED_PASSWORD_TEXT);
    const digest2 = await encodePassword(FIXED_PASSWORD_TEXT);
    expect(digest1).not.toBe(digest2);
  });

  it('should derive expected encryption key from fixed password + salt', async () => {
    const key = await deriveEncryptionKey(
      FIXED_PASSWORD_TEXT,
      FIXED_RANDOM_SALT
    );
    expect(Buffer.from(key).toString('hex')).toBe(FIXED_ENCRYPTION_KEY_HEX);
  });
});
