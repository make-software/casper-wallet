import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';

interface CreatePasswordWorkerEvent extends MessageEvent {
  data: {
    password: string;
  };
}

onmessage = async function (event: CreatePasswordWorkerEvent) {
  const { password } = event.data;

  const passwordSaltHash = generateRandomSaltHex();
  const passwordHash = await encodePassword(password, passwordSaltHash);
  const keyDerivationSaltHash = generateRandomSaltHex();
  const newEncryptionKeyBytes = await deriveEncryptionKey(
    password,
    keyDerivationSaltHash
  );

  postMessage({
    passwordHash,
    passwordSaltHash,
    newEncryptionKeyHash: convertBytesToHex(newEncryptionKeyBytes),
    keyDerivationSaltHash
  });
};
