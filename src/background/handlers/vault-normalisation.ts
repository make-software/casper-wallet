import { VaultState } from '@background/redux/vault/types';

/**
 * Checksummed (mixed-case) public keys break connected dapps that have not
 * migrated to the new casper SDK behaviour, and older vaults predate `hidden`.
 * Lifted from the unlock page when the decrypt moved into the background —
 * behaviour-preserving, and dropping it would corrupt older stored vaults.
 */
export function normaliseDecryptedVault(vault: VaultState): VaultState {
  const hasCheckSummedPublicKeys = vault.accounts.some(account =>
    /[A-Z]/.test(account.publicKey)
  );

  return {
    ...vault,
    accounts: vault.accounts.map(account => ({
      ...account,
      hidden: account.hidden === undefined ? false : account.hidden,
      publicKey: hasCheckSummedPublicKeys
        ? account.publicKey.toLowerCase()
        : account.publicKey
    }))
  };
}
