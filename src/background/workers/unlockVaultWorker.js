import {
  deriveEncryptionKey,
  generateRandomSaltHex
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { decryptVault, encryptVault } from '@libs/crypto/vault';

/**
 * on unlock decrypt stored vault from cipher
 * generate a new encryption key each login and update existing cipher (collisions0
 * put new encryption key in session
 */

onmessage = async function (event) {
  const { password, keyDerivationSaltHash, vaultCipher } = event.data;

  const encryptionKeyBytes = await deriveEncryptionKey(
    password,
    keyDerivationSaltHash
  );

  const encryptionKeyHash = convertBytesToHex(encryptionKeyBytes);
  //
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
