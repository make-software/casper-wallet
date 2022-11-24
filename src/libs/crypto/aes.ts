import * as aes from 'micro-aes-gcm/index';
import {
  convertBase64ToBytes,
  convertBytesToBase64,
  convertHexToBytes
} from './utils';

export async function aesEncryptString(
  keyHash: string,
  str: string
): Promise<string> {
  const key = convertHexToBytes(keyHash);
  const bytes = await aes.encrypt(key, str);
  return convertBytesToBase64(bytes);
}

export async function aesDecryptString(
  keyHash: string,
  cipherBase64: string
): Promise<string> {
  const key = convertHexToBytes(keyHash);
  const jsonBytes = await aes.decrypt(key, convertBase64ToBytes(cipherBase64));
  return aes.utils.bytesToUtf8(jsonBytes);
}
