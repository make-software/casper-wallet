import { VaultState } from '@background/redux/vault/types';

import {
  deriveEncryptionKey,
  encodePassword,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { encryptVault } from '@libs/crypto/vault';

interface CreatePasswordWorkerEvent extends MessageEvent {
  data: {
    password: string;
    vault: VaultState;
  };
}

onmessage = async function (event: CreatePasswordWorkerEvent) {
  const { password, vault } = event.data;

  try {
    const passwordSaltHash = generateRandomSaltHex();
    const passwordHash = await encodePassword(password, passwordSaltHash);
    const keyDerivationSaltHash = generateRandomSaltHex();
    const newEncryptionKeyBytes = await deriveEncryptionKey(
      password,
      keyDerivationSaltHash
    );
    const newEncryptionKeyHash = convertBytesToHex(newEncryptionKeyBytes);

    const newVaultCipher = await encryptVault(newEncryptionKeyHash, vault);

    postMessage({
      passwordHash,
      passwordSaltHash,
      newEncryptionKeyHash,
      keyDerivationSaltHash,
      newVaultCipher
    });
  } catch (error) {
    // a rejection inside an async onmessage raises no error event on the parent
    // Worker, so the failure has to travel back as a message
    console.error(error);
    postMessage({ error: true });
  }
};
