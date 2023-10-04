import { randomBytes } from '@noble/hashes/utils';
import { aes_256_cbc } from '@noble/ciphers/webcrypto/aes';
import { scryptAsync } from '@noble/hashes/scrypt';
import { CLPublicKey } from 'casper-js-sdk';

import { Account } from '@background/redux/vault/types';

import { convertBytesToBase64 } from './utils';
import { createScryptOptions } from './hashing';

export const generateSyncWalletQrData = async (
  password: string,
  secretPhrase: string[],
  derivedAccounts: Account[],
  importedAccounts: Account[]
) => {
  const salt = randomBytes(16);
  const iv = randomBytes(16);

  const key = await scryptAsync(password, salt, createScryptOptions());

  const qrDataString = JSON.stringify([
    secretPhrase.join(' '),
    derivedAccounts.map(da => da.name),
    [
      ...importedAccounts.map(acc => ({
        secretKey: acc.secretKey,
        label: acc.name,
        publicKeyTag: CLPublicKey.fromHex(acc.publicKey).getTag()
      }))
    ]
  ]);

  const data = Uint8Array.from(Buffer.from(qrDataString));

  const stream = aes_256_cbc(key, iv);
  const cipher = await stream.encrypt(data);

  const qrString = JSON.stringify([
    convertBytesToBase64(cipher),
    convertBytesToBase64(salt),
    convertBytesToBase64(iv)
  ]);

  const qrBytes = Uint8Array.from(Buffer.from(qrString));
  const qrData = convertBytesToBase64(qrBytes);

  return qrData;
};
