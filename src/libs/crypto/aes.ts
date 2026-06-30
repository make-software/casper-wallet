import { gcm } from '@noble/ciphers/aes.js';
import {
  bytesToUtf8,
  concatBytes,
  randomBytes,
  utf8ToBytes
} from '@noble/ciphers/utils.js';

import {
  convertBase64ToBytes,
  convertBytesToBase64,
  convertHexToBytes
} from './utils';

export async function aesEncryptString(
  keyHash: string,
  str: string
): Promise<string> {
  const iv = randomBytes(12);
  const ciphertext = gcm(convertHexToBytes(keyHash), iv).encrypt(
    utf8ToBytes(str)
  );

  return convertBytesToBase64(concatBytes(iv, ciphertext));
}

export async function aesDecryptString(
  keyHash: string,
  cipherBase64: string
): Promise<string> {
  const data = convertBase64ToBytes(cipherBase64);
  const plaintext = gcm(convertHexToBytes(keyHash), data.slice(0, 12)).decrypt(
    data.slice(12)
  );

  return bytesToUtf8(plaintext);
}
