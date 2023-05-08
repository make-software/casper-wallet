import { VaultState } from '@background/redux/vault/types';

export type UnlockVault = {
  vault: VaultState;
  newKeyDerivationSaltHash: string;
  newVaultCipher: string;
  newEncryptionKeyHash: string;
};
