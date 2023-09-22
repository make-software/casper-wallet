import { randomBytes } from '@noble/hashes/utils';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { CLPublicKey } from 'casper-js-sdk';
import { aes_256_cbc } from '@noble/ciphers/webcrypto/aes';
import { convertBytesToBase64 } from '@libs/crypto/utils';
import { Account } from '@background/redux/vault/types';

export const generateSyncWalletQrData = async (
  password: string,
  secretPhrase: string[],
  derivedAccounts: Account[],
  importedAccounts: Account[]
) => {
  const salt = randomBytes(16);
  const iv = randomBytes(16);
  const key = await pbkdf2Async(sha256, password, salt, {
    c: 5000,
    dkLen: 32
  });

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
