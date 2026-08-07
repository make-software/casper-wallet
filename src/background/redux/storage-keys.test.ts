import {
  AUTO_LOCK_DEADLINE_KEY,
  LOGIN_RETRY_LOCKOUT_DEADLINE_KEY
} from '@background/redux/storage-keys';

// The module comment says these strings are immutable once shipped. Nothing
// else can observe that: `vault-sagas.test.ts` uses the constants symbolically
// on both sides of every assertion — the fixture key and the asserted key are
// the same symbol — so a rename ships fully green there. The literals otherwise
// live only in the module and in `docs/architecture/storage-keys.md`, with no
// doc/code parity check anywhere in `src`, `scripts` or CI.
//
// Renaming one strands the persisted entry: `vault-sagas.ts` falls back to a
// recomputed deadline rather than failing open, so an already-locked-out user
// silently gets a fresh full lockout instead of the residual one. These
// assertions are the only thing that can catch that, so DO NOT "fix" a failure
// here by updating the expected string — revert the rename instead.
describe('storage-keys — shipped values are immutable', () => {
  it('pins LOGIN_RETRY_LOCKOUT_DEADLINE_KEY', () => {
    expect(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY).toBe('q9Tf3Lm4pRxVne');
  });

  it('pins AUTO_LOCK_DEADLINE_KEY', () => {
    expect(AUTO_LOCK_DEADLINE_KEY).toBe('r3Wj7Nc8vBhQyD');
  });

  it('keeps the two keys distinct', () => {
    expect(LOGIN_RETRY_LOCKOUT_DEADLINE_KEY).not.toBe(AUTO_LOCK_DEADLINE_KEY);
  });
});
