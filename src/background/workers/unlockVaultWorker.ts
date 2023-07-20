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

interface UnlockVaultMessageEvent extends MessageEvent {
  data: {
    password: string;
    keyDerivationSaltHash: string;
    vaultCipher: VaultCipherState;
  };
}

onmessage = async function (event: UnlockVaultMessageEvent) {
  const { password, keyDerivationSaltHash, vaultCipher } = event.data;

  const encryptionKeyBytes = await deriveEncryptionKey(
    password,
    keyDerivationSaltHash
  );
  console.log(encryptionKeyBytes, 'encryptionKeyBytes');

  const encryptionKeyHash = convertBytesToHex(encryptionKeyBytes);
  console.log(encryptionKeyHash, 'encryptionKeyHash');
  // decrypt cipher
  const vault = await decryptVault(encryptionKeyHash, vaultCipher);
  console.log(vault, 'vault');

  // derive a new random encryption key
  const newKeyDerivationSaltHash = generateRandomSaltHex();
  console.log(newKeyDerivationSaltHash, 'newKeyDerivationSaltHash');
  const newEncryptionKeyBytes = await deriveEncryptionKey(
    password,
    newKeyDerivationSaltHash
  );
  console.log(newEncryptionKeyBytes, 'newEncryptionKeyBytes');
  const newEncryptionKeyHash = convertBytesToHex(newEncryptionKeyBytes);
  console.log(newEncryptionKeyHash, 'newEncryptionKeyHash');
  // encrypt cipher with the new key
  const newVaultCipher = await encryptVault(newEncryptionKeyHash, vault);
  console.log(newVaultCipher, 'newVaultCipher');
  postMessage({
    vault,
    newVaultCipher,
    newKeyDerivationSaltHash,
    newEncryptionKeyHash
  });
};
