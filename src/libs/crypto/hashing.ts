import { scryptAsync } from '@noble/hashes/scrypt';
import { randomBytes } from '@noble/hashes/utils';

import { convertBytesToHex, convertHexToBytes } from './utils';

function generateRandomSaltBytes() {
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
    .catch(() => {
      throw Error('encodePassword failed!');
    });
}

export function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const left = convertHexToBytes(a);
  const right = convertHexToBytes(b);

  // Buffer.from(hex) truncates at a dangling nibble or the first non-hex
  // character, so a short decode means the input was not canonical hex.
  if (left.length !== a.length / 2 || right.length !== b.length / 2) {
    return false;
  }

  let diff = 0;
  // must scan every byte — returning early on the first mismatch reintroduces the timing leak
  for (let i = 0; i < left.length; i++) {
    diff |= left[i] ^ right[i];
  }

  return diff === 0;
}

export async function verifyPasswordAgainstHash(
  passwordHash: string,
  passwordSaltHash: string,
  password: string | undefined
): Promise<boolean> {
  const digest = await encodePassword(password || '', passwordSaltHash);

  return constantTimeEqualHex(passwordHash, digest);
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
