// src/libs/crypto/aes.back-compat.test.ts
import { createCipheriv } from 'crypto';

import {
  FIXED_ENCRYPTION_CIPHER_TEXT,
  FIXED_ENCRYPTION_KEY_HASH,
  FIXED_ENCRYPTION_PLAIN_TEXT
} from './__fixtures';
import { aesDecryptString, aesEncryptString } from './aes';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

describe('crypto.aes vault byte-compat', () => {
  it('decrypts a legacy micro-aes-gcm vault blob unchanged', async () => {
    const decrypted = await aesDecryptString(
      FIXED_ENCRYPTION_KEY_HASH,
      FIXED_ENCRYPTION_CIPHER_TEXT
    );

    expect(decrypted).toBe(FIXED_ENCRYPTION_PLAIN_TEXT);
  });

  it('produces the documented base64(iv[12] || ciphertext || tag[16]) layout', async () => {
    const cipherBase64 = await aesEncryptString(
      FIXED_ENCRYPTION_KEY_HASH,
      FIXED_ENCRYPTION_PLAIN_TEXT
    );
    const bytes = Buffer.from(cipherBase64, 'base64');
    const plaintextLength = Buffer.byteLength(
      FIXED_ENCRYPTION_PLAIN_TEXT,
      'utf8'
    );

    expect(bytes.length).toBe(IV_LENGTH + plaintextLength + TAG_LENGTH);
  });

  it('decrypts a blob built by an independent AES-256-GCM oracle (fixed key + iv)', async () => {
    const key = Buffer.from(FIXED_ENCRYPTION_KEY_HASH, 'hex'); // 32 bytes
    const iv = Buffer.alloc(IV_LENGTH, 7); // deterministic 12-byte nonce
    const plaintext = 'casper vault back-compat probe';

    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag(); // 16 bytes
    const blob = Buffer.concat([iv, ciphertext, tag]).toString('base64');

    const decrypted = await aesDecryptString(FIXED_ENCRYPTION_KEY_HASH, blob);

    expect(decrypted).toBe(plaintext);
  });

  it('round-trips encrypt → decrypt', async () => {
    const plaintext = 'round trip';
    const blob = await aesEncryptString(FIXED_ENCRYPTION_KEY_HASH, plaintext);

    const decrypted = await aesDecryptString(FIXED_ENCRYPTION_KEY_HASH, blob);

    expect(decrypted).toBe(plaintext);
  });
});
