import {
  deriveEncryptionKey,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { decryptVault, encryptVault } from '@libs/crypto/vault';
import { VaultCipherState } from '@background/redux/vault-cipher/types';

/**
 * on unlock decrypt stored vault from cipher
 * generate a new encryption key each login and update existing cipher (collisions0
 * put new encryption key in session
 */

interface UnlockVaultEventData extends MessageEvent {
  data: {
    password: string;
    keyDerivationSaltHash: string;
    vaultCipher: VaultCipherState;
  };
}

onmessage = async function (event: UnlockVaultEventData) {
  const { password, keyDerivationSaltHash, vaultCipher } = event.data;

  const encryptionKeyBytes = await deriveEncryptionKey(
    password,
    keyDerivationSaltHash
  );

  const encryptionKeyHash = convertBytesToHex(encryptionKeyBytes);
  // decrypt cipher
  const vault = await decryptVault(encryptionKeyHash, vaultCipher);

  // derive a new random encryption key
  const newKeyDerivationSaltHash = generateRandomSaltHex();
  const newEncryptionKeyBytes = await deriveEncryptionKey(
    password,
    newKeyDerivationSaltHash
  );
  const newEncryptionKeyHash = convertBytesToHex(newEncryptionKeyBytes);

  // encrypt cipher with the new key
  const newVaultCipher = await encryptVault(newEncryptionKeyHash, vault);

  postMessage({
    vault,
    newVaultCipher,
    newKeyDerivationSaltHash,
    newEncryptionKeyHash
  });
};
