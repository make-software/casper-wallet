import { PrivateState } from '@background/handlers/private-state';

/** True if any private-material field differs between two selections. */
export function privateStateChanged(
  prev: PrivateState,
  next: PrivateState
): boolean {
  return (
    prev.passwordHash !== next.passwordHash ||
    prev.passwordSaltHash !== next.passwordSaltHash ||
    prev.keyDerivationSaltHash !== next.keyDerivationSaltHash ||
    prev.vaultCipher !== next.vaultCipher
  );
}
