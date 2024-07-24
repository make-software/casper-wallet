import { aes_256_cbc } from '@noble/ciphers/webcrypto/aes';
import { scryptAsync } from '@noble/hashes/scrypt';
import { randomBytes } from '@noble/hashes/utils';
import { CLPublicKey } from 'casper-js-sdk';

import { createScryptOptions } from '@libs/crypto/hashing';
import { convertBytesToBase64 } from '@libs/crypto/utils';
import { Account } from '@libs/types/account';

interface GenerateSyncWalletQrDataEvent extends MessageEvent {
  data: {
    password: string;
    secretPhrase: string[];
    derivedAccounts: Account[];
    importedAccounts: Account[];
  };
}

onmessage = async function (event: GenerateSyncWalletQrDataEvent) {
  const { password, secretPhrase, derivedAccounts, importedAccounts } =
    event.data;

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
  const qrDataArray = qrData.match(/.{1,200}/g);

  const result = (qrDataArray ?? [qrData]).map(
    (qr, i, arr) => `${i + 1}$${arr.length}$${qr}`
  );

  postMessage({
    result
  });
};
