// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-no-math-random-for-crypto.
// `paths.include` (src/libs/crypto/**, src/background/redux/sagas/**) is not
// exercised — semgrep --test bypasses `paths:`. See .semgrep/README.md.

export function insecure() {
  // ruleid: cw-no-math-random-for-crypto
  const nonce = Math.random();
  // ruleid: cw-no-math-random-for-crypto
  const index = Math.floor(Math.random() * 100);
  return { nonce, index };
}

export function secure() {
  // ok: cw-no-math-random-for-crypto
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  // ok: cw-no-math-random-for-crypto
  const rounded = Math.floor(1.5);
  // ok: cw-no-math-random-for-crypto
  const max = Math.max(1, 2);
  return { bytes, rounded, max };
}
