import * as argon2 from 'argon2-browser';
import { randomBytes } from '@noble/hashes/utils';
import { convertBytesToHex, convertHexToBytes } from './utils';

export function generateRandomSaltBytes() {
  return randomBytes(32);
}

export function generateRandomSaltHex() {
  return convertBytesToHex(randomBytes(32));
}

const createOptions = ({
  password,
  saltHex,
  passwordDigest
}: {
  password: string;
  saltHex?: string;
  passwordDigest?: string;
}) => {
  const options: any = {
    pass: password,
    type: argon2.ArgonType.Argon2i,
    hashLen: 32
  };

  options.salt = saltHex
    ? convertHexToBytes(saltHex)
    : generateRandomSaltBytes();

  if (passwordDigest) {
    options.encoded = passwordDigest;
  }

  return options;
};

export async function encodePassword(password: string): Promise<string> {
  return await argon2
    .hash(createOptions({ password }))
    .then(res => {
      return res.encoded;
    })
    .catch(err => {
      throw Error('Argon encode failed!');
    });
}

export async function verifyPasswordAgainstDigest(
  passwordDigest: string,
  password?: string
): Promise<boolean> {
  return await argon2
    .verify(createOptions({ password: password || '', passwordDigest }))
    .then(res => {
      return true;
    })
    .catch(err => {
      return false;
    });
}

export async function deriveEncryptionKey(
  password: string,
  saltHex: string
): Promise<Uint8Array> {
  return await argon2
    .hash(createOptions({ password, saltHex }))
    .then(res => {
      return res.hash;
    })
    .catch(err => {
      throw Error('Argon key failed!');
    });
}
