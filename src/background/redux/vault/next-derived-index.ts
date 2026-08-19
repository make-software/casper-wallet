import { SecretPhrase, deriveKeyPair } from '@libs/crypto';
import { Account } from '@libs/types/account';

// The account list is the authority, not `derivationIndex`: that field is optional
// and absent on accounts created before it existed.
export function findNextDerivedIndex(
  secretPhrase: SecretPhrase | null,
  derivedAccounts: Account[]
): number {
  const derivedPublicKeys = new Set(
    derivedAccounts.map(account => account.publicKey)
  );

  let index = 0;

  // Derive once per index, not once per (index, account) pair — this runs
  // synchronously in the message handler under requestWithRetry's 5s timeout.
  while (derivedPublicKeys.has(deriveKeyPair(secretPhrase, index).publicKey)) {
    index++;
  }

  return index;
}
