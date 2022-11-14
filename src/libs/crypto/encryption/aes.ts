import * as aes from 'micro-aes-gcm/index';
import { deriveEncryptionKey } from '../hashing';
import { convertBase64ToBytes, convertBytesToBase64 } from '../utils';

export async function aesEncryptString(
  password: string,
  saltBase64: string,
  str: string
): Promise<string> {
  const key = await deriveEncryptionKey(password, saltBase64);
  const bytes = await aes.encrypt(key, str);
  return convertBytesToBase64(bytes);
}

export async function aesDecryptString(
  password: string,
  saltBase64: string,
  cipherBase64: string
): Promise<string> {
  const key = await deriveEncryptionKey(password, saltBase64);
  const jsonBytes = await aes.decrypt(key, convertBase64ToBytes(cipherBase64));
  return aes.utils.bytesToUtf8(jsonBytes);
}
