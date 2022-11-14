import {
  FIXED_ENCRYPTION_CIPHER_TEXT,
  FIXED_ENCRYPTION_PLAIN_TEXT,
  FIXED_PASSWORD_TEXT,
  FIXED_RANDOM_SALT
} from '../__fixtures';
import { aesDecryptString, aesEncryptString } from './aes';

describe('crypto.aes', () => {
  it('should encrypt plain text correctly', async () => {
    const cipherBase64 = await aesEncryptString(
      FIXED_PASSWORD_TEXT,
      FIXED_RANDOM_SALT,
      FIXED_ENCRYPTION_PLAIN_TEXT
    );

    const decryptedText = await aesDecryptString(
      FIXED_PASSWORD_TEXT,
      FIXED_RANDOM_SALT,
      cipherBase64
    );

    expect(decryptedText).toBe(FIXED_ENCRYPTION_PLAIN_TEXT);
  });

  it('should decrypt existing cipher text correctly', async () => {
    const decryptedValue = await aesDecryptString(
      FIXED_PASSWORD_TEXT,
      FIXED_RANDOM_SALT,
      FIXED_ENCRYPTION_CIPHER_TEXT
    );

    expect(decryptedValue).toBe(FIXED_ENCRYPTION_PLAIN_TEXT);
  });

  it('should generate random cipher text each time with the same inputs', async () => {
    const cipherBase64_a = await aesEncryptString(
      FIXED_PASSWORD_TEXT,
      FIXED_RANDOM_SALT,
      FIXED_ENCRYPTION_PLAIN_TEXT
    );

    const cipherBase64_b = await aesEncryptString(
      FIXED_PASSWORD_TEXT,
      FIXED_RANDOM_SALT,
      FIXED_ENCRYPTION_PLAIN_TEXT
    );

    expect(cipherBase64_a).not.toBe(cipherBase64_b);
  });
});
