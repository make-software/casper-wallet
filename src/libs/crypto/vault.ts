import { VaultState } from '@src/background/redux/vault/types';
import { aesDecryptString, aesEncryptString } from './aes';

export async function encryptVault(
  encryptionKeyHash: string | null,
  vaultState: VaultState
): Promise<string> {
  if (encryptionKeyHash == null) {
    throw Error("Encryption key doesn't exist");
  }
  if (!vaultState || typeof vaultState !== 'object') {
    throw Error("Vault State doesn't exist");
  }

  return aesEncryptString(encryptionKeyHash, JSON.stringify(vaultState)).catch(
    err => {
      throw Error(err);
    }
  );
}

export async function decryptVault(
  encryptionKeyHash: string | null,
  vaultStateCipher: string | null
): Promise<VaultState> {
  if (encryptionKeyHash == null) {
    throw Error("Encryption key doesn't exist");
  }
  if (vaultStateCipher == null) {
    throw Error("Cipher doesn't exist");
  }

  return aesDecryptString(encryptionKeyHash, vaultStateCipher)
    .then(val => JSON.parse(val) as VaultState)
    .catch(err => {
      throw Error(err);
    });
}
