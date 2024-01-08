import { scryptAsync } from '@noble/hashes/scrypt';
import { randomBytes } from '@noble/hashes/utils';

import { convertBytesToHex, convertHexToBytes } from './utils';

export function generateRandomSaltBytes() {
  return randomBytes(32);
}

export function generateRandomSaltHex() {
  return convertBytesToHex(generateRandomSaltBytes());
}

export const createScryptOptions = () => {
  const options = { N: 2 ** 18, r: 8, p: 1, dkLen: 32 };
  return options;
};

export async function encodePassword(
  password: string,
  saltHash: string
): Promise<string> {
  return scryptAsync(
    password,
    convertHexToBytes(saltHash),
    createScryptOptions()
  )
    .then(convertBytesToHex)
    .catch(err => {
      throw Error('encodePassword failed!');
    });
}

export async function verifyPasswordAgainstHash(
  passwordHash: string,
  passwordSaltHash: string,
  password: string | undefined
): Promise<boolean> {
  const digest = await encodePassword(password || '', passwordSaltHash);

  return passwordHash === digest;
}

export async function deriveEncryptionKey(
  password: string,
  keyDerivationSaltHash: string
): Promise<Uint8Array> {
  return scryptAsync(
    password,
    convertHexToBytes(keyDerivationSaltHash),
    createScryptOptions()
  );
}
