// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-logging-secrets.
// This rule is pattern-regex, so it matches raw file text including comments.
// Do not write example log calls in comments here — they would be flagged.

export function leaks(privateKey, mnemonic, seed, wallet) {
  // ruleid: cw-logging-secrets
  console.log(privateKey);
  // ruleid: cw-logging-secrets
  console.warn('restoring', mnemonic);
  // ruleid: cw-logging-secrets
  console.error({ seed });
  // ruleid: cw-logging-secrets
  console.debug(`derived: ${privateKey}`);
  // ruleid: cw-logging-secrets
  console.info(wallet.secretPhrase);
}

export function safe(accountName, vaultCipher, privateKey, logger) {
  // ok: cw-logging-secrets
  console.log('user opened the account list');
  // ok: cw-logging-secrets
  console.log(accountName);
  // ok: cw-logging-secrets
  console.log(vaultCipher);
  // ok: cw-logging-secrets
  logger.info(privateKey);
}
